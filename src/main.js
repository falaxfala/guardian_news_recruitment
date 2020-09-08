import './styles/main.css';

// Please use https://open-platform.theguardian.com/documentation/

export default class News {

    constructor(
        limit = 30,
        newsContainerClass = 'newsList',
        pageSelectorContainerClass = 'pageSelectorContainer',
        readLaterContainerClass = 'readLaterList'
    ) {

        this.limit = limit;
        this.newsContainerClass = newsContainerClass;
        this.pageSelectorContainerClass = pageSelectorContainerClass;
        this.readLaterContainerClass = readLaterContainerClass;

        this.apiKey = '2dcf62a4-f5cb-4776-afae-ac3eb9272dc4';
        this.newsData = new Array();
        this.responseDetails = new Object();
        this.isArticlesLoading = false;

        this.readLater = JSON.parse(localStorage.getItem('readLater')) || [];

        this.page = 1;
        this.section = '';
        this.searchPhrase = '';
    }

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

    fetchNews = () => {
        this.isArticlesLoading = true;
        return new Promise(async (resolve, reject) => {
            let limitedDate = new Date();
            limitedDate.setDate(limitedDate.getDate() - this.limit);
            limitedDate = limitedDate.toISOString();

            const sectionSelector = (this.section === '') ? '' : '&section=' + this.section;
            const searchingPhrase = (this.searchPhrase === '') ? '' : '&q=' + this.searchPhrase;

            return await fetch('https://content.guardianapis.com/search?api-key=' + this.apiKey + '&from-date=' + limitedDate + '&page=' + this.page + sectionSelector + searchingPhrase)
                .then(res => res.json())
                .then(res => {
                    const { response } = res;
                    const { results, ...data } = response;

                    this.newsData = results;
                    this.responseDetails = data;
                    this.isArticlesLoading = false;
                    resolve(results);
                })
                .catch(err => {
                    this.isArticlesLoading = false;
                    reject(err);
                });
        });
    }

    printNews = (data) => {
        data.forEach((elem, index) => {
            const newsListDOM = document.querySelector('.' + this.newsContainerClass);
            const {
                id,
                webTitle,
                sectionName,
                webUrl
            } = elem;
            let systemId = id.split('/');
            systemId = systemId[systemId.length - 1];
            elem.systemId = systemId;

            const pDate = new Date(elem.webPublicationDate).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric'
            });

            const savedClass = this.checkIfElementIsSaved(elem) ? ' saved' : '';
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

            document.querySelector('#btn-read-later-' + systemId).addEventListener('click', (event) => this.addToReadLater(elem));
        });
    }

    createPageSelector() {

        const {
            pages,
            currentPage
        } = this.responseDetails;

        const pageSelectorContainer = document.querySelector('.' + this.pageSelectorContainerClass);
        pageSelectorContainer.innerHTML = "";

        let htmlResult = '<select id="activePageSelect">';
        for (var i = 1; i <= pages; i++) {
            const isCurrent = (i === currentPage) ? 'selected' : '';
            htmlResult += '<option ' + isCurrent + ' value="' + i + '">' + i + '</option>';
        }
        htmlResult += '</select>';

        pageSelectorContainer.insertAdjacentHTML('afterbegin', htmlResult);
        document.querySelector('#activePageSelect').addEventListener('change', (event) => this.setPage = event.target.value);
    }


    showNewsToReadLater = (list) => {
        const parentContainer = document.querySelector('.' + this.readLaterContainerClass);
        parentContainer.innerHTML = "";

        if (list.length > 0) {
            list.forEach((news, index) => {
                parentContainer.insertAdjacentHTML('afterbegin', `<li>
                <h4 class="readLaterItem-title">`+ news.webTitle + `</h4>
                <section>
                  <a href="#" onclick="window.open('`+ news.webUrl + `', 'Saved news', 'width=` + window.innerWidth + `,height=` + window.innerHeight + `');" class="button button-clear">Read</a>
                  <button id="btn-remove-`+ news.systemId + `" class="button button-clear">Remove</button>
                </section>
              </li>`);
                document.querySelector('#btn-remove-' + news.systemId).addEventListener('click', () => this.removeFromReadLater(news));

            });
        } else {
            parentContainer.insertAdjacentHTML('afterbegin', '<span>No saved news</span>');
        }
    }



    addToReadLater = (elem) => {
        const currentReadLaterList = this.readLater;

        const {
            id,
            webTitle,
            webUrl,
            systemId
        } = elem;

        if (!this.checkIfElementIsSaved(elem)) {
            currentReadLaterList.push({ id, webTitle, webUrl, systemId });
            localStorage.setItem('readLater', JSON.stringify(currentReadLaterList));
            this.showNewsToReadLater(currentReadLaterList);
            document.querySelector('#news-' + elem.systemId + ' > .news').classList.add('saved');
        } else {
            this.removeFromReadLater(elem); //Add a toggle effect
        }
    }

    removeFromReadLater = (elem) => {
        const currentReadLaterList = this.readLater;
        const { id } = elem;

        if (this.checkIfElementIsSaved(elem)) {
            currentReadLaterList.forEach((savedElem, index) => {
                if (savedElem.id === id) {
                    currentReadLaterList.splice(index, 1);

                    localStorage.setItem('readLater', JSON.stringify(currentReadLaterList));
                    this.showNewsToReadLater(currentReadLaterList);
                    const newsElement = document.querySelector('#news-' + elem.systemId + ' > .news');
                    if (newsElement) {
                        document.querySelector('#news-' + elem.systemId + ' > .news').classList.remove('saved');
                    }
                }
            });
        } else {
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