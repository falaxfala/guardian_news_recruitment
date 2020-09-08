import './styles/main.css';

/*
* Ok, I have small amount of time left, so I will explain it fast
* Here's class News, and everything in this task is handled by that.
* I had in my mind a lot more of ideas, but time... :(
* This short task was simple and fine. Coding this app was pleasure for me.
* It's been ages since I used clear, vanilla JS (without React, redux, axios etc.)
* so greatest problem for me was my hard habits. I will be honest (it's not a joke, really)
* I waste almost 20 minutes to find out, why my promise always gave me rejection, and then I realized
* that fetchAPI it's not an Axios, and I have to parse my response first :P 
* I hope everything is fine and clear (it's working perfect on my PC ^^)
* And sorry for my english, I know my grammar is not perfect, but I think everything is understandable
*
* Thanks for that chance, and I will wait for feedback, good or worse...
* Łukasz Falkowski
*/

export default class News {

    //Load defaults
    constructor(
        limit = 30,
        newsContainerClass = 'newsList',
        pageSelectorContainerClass = 'pageSelectorContainer',
        readLaterContainerClass = 'readLaterList'
    ) {
        //Add a defaults to class variables
        this.limit = limit;
        this.newsContainerClass = newsContainerClass;
        this.pageSelectorContainerClass = pageSelectorContainerClass;
        this.readLaterContainerClass = readLaterContainerClass;

        this.apiKey = '2dcf62a4-f5cb-4776-afae-ac3eb9272dc4'; //KEY FROM GUARDIAN NEWS
        this.newsData = new Array(); //Array of objects with news data fetched from API
        this.responseDetails = new Object(); //Every other information from response
        this.isArticlesLoading = false; //Helper 

        this.readLater = JSON.parse(localStorage.getItem('readLater')) || []; //Data from localStorage (saved to read later)

        //Filter variables
        this.page = 1;
        this.section = '';
        this.searchPhrase = '';
    }

    /*
    *   An Init method to call outside and start whole lifecycle of this class
    *   This method is for enqueue init and refresh actions, by promise returned from fetchNews()
    */

    initNews = () => {
        document.querySelector('.' + this.newsContainerClass).innerHTML = ""; //Clear news container

        this.fetchNews() //Get news data from server
            .then(data => {
                this.printNews(data); //Print data to screen
            })
            .then(() => {
                this.createPageSelector(); //Create page selector, depends on count of pages
            })
            .then(() => {
                this.showNewsToReadLater(this.readLater); //Load from localStorage and print list of saved news
            });
    }

    /*
    * A method for getting data from API (returns Promise)
    */
    fetchNews = () => {
        this.isArticlesLoading = true;//Start loading articles

        const newsListDOM = document.querySelector('.' + this.newsContainerClass);//Get container from DOM

        if (this.isArticlesLoading) {
            newsListDOM.innerHTML = '<div class="loader"></div>'; //If promise was started, and didn't resolved yet -> show preloader
        }

        return new Promise(async (resolve, reject) => { //Create a Promise
            //Handle and parse filter variables
            let limitedDate = new Date();
            limitedDate.setDate(limitedDate.getDate() - this.limit);
            limitedDate = limitedDate.toISOString();

            const sectionSelector = (this.section === '') ? '' : '&section=' + this.section;
            const searchingPhrase = (this.searchPhrase === '') ? '' : '&q=' + this.searchPhrase;

            //Use fetch to get data from API
            return await fetch('https://content.guardianapis.com/search?api-key=' + this.apiKey + '&from-date=' + limitedDate + '&page=' + this.page + sectionSelector + searchingPhrase, {
                method: 'GET'
            })
                .then(res => res.json()) //Parse result
                .then(res => { //Data management
                    const { response } = res;
                    const { results, ...data } = response;

                    this.newsData = results;
                    this.responseDetails = data;
                    this.isArticlesLoading = false;
                    resolve(results); //Important data - resolve
                })
                .catch(err => { //Catch errors
                    this.isArticlesLoading = false;
                    reject(err);
                });
        });
    }

    /*
    * A method to print every news object, stored in newsData
    */
    printNews = (data) => {
        const newsListDOM = document.querySelector('.' + this.newsContainerClass); //Get container from DOM

        if (data.length > 0 && !this.isArticlesLoading) { //We're done with loading and have some results
            newsListDOM.innerHTML = ''; //Clear container
            data.forEach((elem, index) => { //For every element
                const {
                    id,
                    webTitle,
                    sectionName,
                    webUrl
                } = elem;

                //I haven't any valid id to handle DOM events from API,
                //so I have to create one from id which was given
                let systemId = id.split('/');
                systemId = systemId[systemId.length - 1];
                elem.systemId = systemId;

                //Format date
                const pDate = new Date(elem.webPublicationDate).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: 'numeric'
                });

                //Check if element is saved in readLater list, if yes, then add a 'saved' class
                const savedClass = this.checkIfElementIsSaved(elem) ? ' saved' : '';
                //Print element for every news
                newsListDOM.insertAdjacentHTML('afterbegin', `<li id="news-` + systemId + `">
                <article class="news `+ savedClass + `">
                  <header>
                    <h3>`+ webTitle + `</h3>
                  </header>
                  <section class="newsDetails">
                    <ul>
                      <li><strong>Section Name:</strong> `+ sectionName + `</li>
                      <li><strong>Publication Date:</strong> `+ pDate + `</li>
                    </ul>
                  </section>
                  <section class="newsActions">
                    <a href="#" onclick="window.open('`+ webUrl + `', 'Read the article','width=` + window.innerWidth + `,height=` + window.innerHeight + `')" class="button">Full article</a>
                    <button id="btn-read-later-`+ systemId + `" class="button button-outline">Read Later</button>
                  </section>
                </article>
              </li>`);

                //Add a listener to handle adding to readLater list
                document.querySelector('#btn-read-later-' + systemId).addEventListener('click', (event) => this.addToReadLater(elem));
            });
        } else {
            newsListDOM.innerHTML = '<span>No results found</span>';
        }
    }

    /*
    *   A method to generate dynamic <select> object, depends on pages count
    */
    createPageSelector() {

        const {
            pages,
            currentPage
        } = this.responseDetails; //Get important data from response details

        const pageSelectorContainer = document.querySelector('.' + this.pageSelectorContainerClass); //Get container from DOM
        pageSelectorContainer.innerHTML = "";//Clear container

        //Add a <select> mark and every option
        let htmlResult = '<select id="activePageSelect">';
        for (var i = 1; i <= pages; i++) {
            const isCurrent = (i === currentPage) ? 'selected' : '';
            htmlResult += '<option ' + isCurrent + ' value="' + i + '">' + i + '</option>';
        }
        htmlResult += '</select>';

        pageSelectorContainer.insertAdjacentHTML('afterbegin', htmlResult); //Insert mark in container
        document.querySelector('#activePageSelect').addEventListener('change', (event) => this.setPage = event.target.value); //Add an event to handle selection and call reload method
    }

    /*
    *  A method to refresh saved list
    */

    showNewsToReadLater = (list) => {
        const parentContainer = document.querySelector('.' + this.readLaterContainerClass);
        parentContainer.innerHTML = "";//Get and clear container

        if (list.length > 0) { //If we have any saved elements
            list.forEach((news, index) => { //Add element for every saved news
                parentContainer.insertAdjacentHTML('afterbegin', `<li>
                <h4 class="readLaterItem-title">`+ news.webTitle + `</h4>
                <section>
                  <a href="#" onclick="window.open('`+ news.webUrl + `', 'Saved news', 'width=` + window.innerWidth + `,height=` + window.innerHeight + `');" class="button button-clear">Read</a>
                  <button id="btn-remove-`+ news.systemId + `" class="button button-clear">Remove</button>
                </section>
              </li>`);
                document.querySelector('#btn-remove-' + news.systemId).addEventListener('click', () => this.removeFromReadLater(news)); //Add a listener for button - REMOVE

            });
        } else {
            parentContainer.insertAdjacentHTML('afterbegin', '<span>No saved news</span>');//We have no results, so show message
        }
    }


    /*
    * Method to add a new element to stored list
    */
    addToReadLater = (elem) => {
        const currentReadLaterList = this.readLater; //Get current list

        const {
            id,
            webTitle,
            webUrl,
            systemId
        } = elem;
        //Exclude needed variables from element

        if (!this.checkIfElementIsSaved(elem)) { // If element does not exists in localStorage
            currentReadLaterList.push({ id, webTitle, webUrl, systemId }); //Then push variables in object
            localStorage.setItem('readLater', JSON.stringify(currentReadLaterList));//Overwrite data in localStorage
            this.showNewsToReadLater(currentReadLaterList);//Refresh list in DOM
            document.querySelector('#news-' + elem.systemId + ' > .news').classList.add('saved'); //Add class to mark element as saved
        } else {
            this.removeFromReadLater(elem); //Add a toggle effect
        }
    }


    /*
    * A method to remove element from localStorage, and update css classes
    */
    removeFromReadLater = (elem) => {
        const currentReadLaterList = this.readLater; //Get current list
        const { id } = elem; //exclude id from element to remove

        if (this.checkIfElementIsSaved(elem)) { //If element is currently saved
            currentReadLaterList.forEach((savedElem, index) => { //check every saved element
                if (savedElem.id === id) { // If Ids match
                    currentReadLaterList.splice(index, 1); //Splice this one from local array

                    localStorage.setItem('readLater', JSON.stringify(currentReadLaterList)); //Overwrite data in localStorage
                    this.showNewsToReadLater(currentReadLaterList); //Refresh list in DOM

                    //I've got a little problem with classess and pagination. This simple check is for handle dynamic class removal
                    //without reloading whole list
                    const newsElement = document.querySelector('#news-' + elem.systemId + ' > .news');
                    if (newsElement) {
                        document.querySelector('#news-' + elem.systemId + ' > .news').classList.remove('saved');
                    }
                }
            });
        } else {
            //Small possibility, but always worth to check :)
            alert("Element was removed earlier");
        }
    }


    //SETTERS
    set setPage(p) {
        this.page = p;
        this.initNews();
    }

    set setSection(s) {
        this.section = s;
        this.setPage = 1;
    }

    set setSearchPhrase(s) {
        const finalPhrase = s.replace(/\s/g, ',');
        this.searchPhrase = finalPhrase;
        this.setPage = 1;
    }

    //HELPERS

    /*
    * A method to check if element is saved to read later
    */
    checkIfElementIsSaved = (elem) => {
        let elementExists = false;
        this.readLater.forEach(savedElem => {
            if (savedElem.id === elem.id) {
                elementExists = true;
            }
        });
        return elementExists;
    }
};