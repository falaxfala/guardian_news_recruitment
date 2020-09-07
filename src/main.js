import './styles/main.css';

// Please use https://open-platform.theguardian.com/documentation/

export default class News {

    constructor(
        limit = 30,
        newsContainerClass = 'newsList',
        pageSelectorContainerClass = 'page-selector-container',
    ) {

        this.limit = limit;
        this.newsContainerClass = newsContainerClass;
        this.pageSelectorContainerClass = pageSelectorContainerClass;

        this.apiKey = '2dcf62a4-f5cb-4776-afae-ac3eb9272dc4';
        this.newsData = new Array();
        this.responseDetails = new Object();
        this.isArticlesLoading = false;

        this.page = 1;
        this.section = '';
    }

    initNews = () => {
        document.querySelector('.' + this.newsContainerClass).innerHTML = "";

        this.fetchNews()
            .then(data => {
                this.printNews(data);
            })
            .then(() => {
                this.createPageSelector(this.pageSize);
            });
    }

    fetchNews = () => {
        this.isArticlesLoading = true;
        return new Promise(async (resolve, reject) => {
            let limitedDate = new Date();
            limitedDate.setDate(limitedDate.getDate() - this.limit);
            limitedDate = limitedDate.toISOString();

            const sectionSelector = (this.section === '') ? '' : '&section=' + this.section;

            return await fetch('https://content.guardianapis.com/search?api-key=' + this.apiKey + '&from-date=' + limitedDate + '&page=' + this.page + sectionSelector)
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

            const pDate = new Date(elem.webPublicationDate).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric'
            });

            newsListDOM.insertAdjacentHTML('afterbegin', `<li id="` + id + `">
                <article class="news">
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
                    <a href="#" onclick="window.open('`+webUrl+`', 'Read the article','width=`+window.innerWidth+`,height=`+window.innerHeight+`')" class="button">Full article</a>
                    <button id="btn-read-later-`+ index + `" class="button button-outline">Read Later</button>
                  </section>
                </article>
              </li>`);

            document.querySelector('#btn-read-later-' + index).addEventListener('click', this.addToReadLater);
        });
    }

    createPageSelector(pagination) {

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


    addToReadLater = () => {
        alert('test');
    }

    set setPage(p) {
        this.page = p;
        this.initNews();
    }

    set setSection(s) {
        this.section = s;
        this.setPage = 1;
    }
};