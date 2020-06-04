//получить страну по имени
const getCountryByName = (name, cb) => {
    fetch(`https://restcountries.eu/rest/v2/name/${name}`)
        .then(res => res.json())
        .then(json => {
            cb(json);
        })
        .catch(err => {
            console.log(err);
        });

}


//получить страну по коду
const getCountryByCode = (code) => {
    return fetch(`https://restcountries.eu/rest/v2/alpha/${code}`)
        .then(res => res.json())
        .then(json => {
            return json.name;
        })
        .catch(err => {
            console.log(err);
        });

}
//получить страну по коду
const getCountryDetailsByCode = (code) => {
    return fetch(`https://restcountries.eu/rest/v2/alpha/${code}`)
        .then(res => res.json())
        .then(json => {
            return json;
        })
        .catch(err => {
            console.log(err);
        });

}
const clickOnBorderHandler = (evt) => {

    document.getElementById('country').value = `${evt.currentTarget.param}`;
    document.getElementById('country-output').innerHTML = "";
    document.getElementById('country-list-output').innerHTML = "";
    document.getElementById('search-button').click();

}
const postFavorite = async (favorites) => {
    await fetch('/favorites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({ favorites: favorites })
    });
}
const getFavorite = async (cb) => {
    let response = await fetch('/favorites', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    });
    response.json().then(json => {
        cb(json.favorites);
    });
}
//favorites = [];
const inFavoritesArray = (item, cb) => {
    getFavorite((favorites) => {
        cb(favorites.indexOf(item));
    });
}

const outputFavorites = () => {
    document.getElementById('favorites-content').innerHTML = '';
    getFavorite((favorites) => {
        favorites.forEach(function (item, index) {
            getCountryDetailsByCode(item).then(r => {
                let div = document.createElement('div');
                div.innerHTML = `${index} :  ${r.name}   <a href="#" id="mf-remove-${index}">Remove from Favorites</a>`;
                document.getElementById('favorites-content').appendChild(div);
                document.getElementById(`mf-remove-${index}`).addEventListener('click', () => {
                    removeFromFavoritesByIndex(index);


                    let favoritesText = 'Add to Favorites'

                    document.getElementById(`favoritesButton-${item}`).innerHTML = favoritesText;



                });
            }).catch(err => console.log(err));
        });
    });
}
const addToFavorite = (val) => {
    getFavorite((favorites) => {
        favorites.push(val);
        postFavorite(favorites);
        outputFavorites();
    });

}
const removeFromFavorites = (val) => {
    getFavorite((favorites) => {
        favorites.splice(favorites.indexOf(val), 1);
        postFavorite(favorites);
        outputFavorites();
    });

}
const removeFromFavoritesByIndex = (index) => {
    getFavorite((favorites) => {
        favorites.splice(index, 1);
        postFavorite(favorites);
        outputFavorites();

    });
}
outputFavorites();
document.getElementById('search-button').addEventListener('click', () => {
    
    let val = document.getElementById('country').value;

    document.getElementById('country-output').innerHTML = "";
    document.getElementById('country-list-output').innerHTML = "";
    getCountryByName(val, (json) => {
        if (json.length === 1) {
            let languages = json[0].languages;
            let langList = '<ul>';
            languages.forEach(lang => {
                langList += `<li><p>Название: ${lang.name}</p><p>Нативное название: ${lang.nativeName}</p></li>`
            });
            langList += '</ul>';
            let borders = json[0].borders;
            let bordersList = '<ul id="borders">';
            borders = borders.map(border => {
                return getCountryByCode(border);

            });

            bordersList += '</ul>';
            inFavoritesArray(json[0].alpha3Code, (inFavorites) => {
                let favoritesText = inFavorites === -1 ? 'Add to Favorites' : 'Remove from Favorites';
                document.getElementById('country-output').innerHTML = `<p>Название:${json[0].name}</p>
                <p>
                <img src="${json[0].flag}" alt="${json[0].name}"  style="max-height: 100px;"/>
                </p>
                <p>Код страны в формате ISO 3166-1 : ${json[0].alpha3Code}</p>
                <div><p>Официальные языки: </p>${langList}</div>
                <div><p>Список граничных стран: </p>${bordersList}</div>
                <p><button id="favoritesButton-${json[0].alpha3Code}">${favoritesText}</button></p>`;
                document.getElementById(`favoritesButton-${json[0].alpha3Code}`).addEventListener('click', () => {
                    let thisEl = document.getElementById(`favoritesButton-${json[0].alpha3Code}`);
                    inFavoritesArray(json[0].alpha3Code, inFavorites1 => {

                        if (inFavorites1 >= 0) {
                            removeFromFavorites(json[0].alpha3Code);
                            thisEl.innerHTML = 'Add to Favorites';
                        } else {
                            addToFavorite(json[0].alpha3Code);
                            thisEl.innerHTML = 'Remove from Favorites';
                        }

                    });
                });
                borders.forEach(border => {

                    border.then(res => {
                        let node = document.createElement("li");
                        node.innerHTML = `<a id="a-${res}" href="#">${res}</a>`
                        document.getElementById('borders').appendChild(node);
                        document.getElementById(`a-${res}`).param = res;
                        document.getElementById(`a-${res}`).addEventListener('click', clickOnBorderHandler);
                    });
                });
            });

        }
        else if (json.length > 1) {
            let ul = document.createElement('ul');
            document.getElementById("country-list-output").appendChild(ul);
            json.forEach(el => {

                let li = document.createElement('li');
                li.innerHTML = `<p>${el.name}</p><button id="${el.alpha3Code}">Show more</button><div id="details-${el.alpha3Code}"></div>`
                ul.appendChild(li);
                document.getElementById(`${el.alpha3Code}`).addEventListener('click', () => {
                    getCountryDetailsByCode(el.alpha3Code).then(res => {

                        let languages = res.languages;
                        let langList = '<ul>';
                        languages.forEach(lang => {
                            langList += `<li><p>Название: ${lang.name}</p><p>Нативное название: ${lang.nativeName}</p></li>`
                        });
                        langList += '</ul>';
                        let borders = res.borders;
                        let bordersList = `<ul id="borders1-${res.name}">`;
                        borders = borders.map(border => {
                            return getCountryByCode(border);

                        });

                        bordersList += '</ul>';
                        inFavoritesArray(res.alpha3Code, inFavorites => {
                            let favoritesText = inFavorites ? 'Add to Favorites' : 'Remove from Favorites';
                            document.getElementById(`details-${el.alpha3Code}`).innerHTML = `<p>Название:${res.name}</p>
                        <p>
                        <img src="${res.flag}" alt="${res.name}"  style="max-height: 100px;"/>
                        </p>
                        <p>Код страны в формате ISO 3166-1 : ${res.alpha3Code}</p>
                        <div><p>Официальные языки: </p>${langList}</div>
                        <div><p>Список граничных стран: </p>${bordersList}</div>
                        <p><button id="favoritesButton-${res.alpha3Code}">${favoritesText}</button></p>`;
                            document.getElementById(`favoritesButton-${res.alpha3Code}`).addEventListener('click', () => {
                                let thisEl = document.getElementById(`favoritesButton-${res.alpha3Code}`);
                                inFavoritesArray(res.alpha3Code, (inFavorites) => {
                                    if (inFavorites >= 0) {
                                        removeFromFavorites(res.alpha3Code);
                                        thisEl.innerHTML = 'Add to Favorites';
                                    } else {
                                        addToFavorite(res.alpha3Code);
                                        thisEl.innerHTML = 'Remove from Favorites';
                                    }
                                });

                            });
                            borders.forEach(border => {

                                border.then(r => {
                                    let node = document.createElement("li");
                                    node.innerHTML = `<a id="a-${r}" href="#">${r}</a>`
                                    document.getElementById(`borders1-${res.name}`).appendChild(node);
                                    document.getElementById(`a-${r}`).param = r;
                                    document.getElementById(`a-${r}`).addEventListener('click', clickOnBorderHandler);

                                });
                            });
                        });

                    });

                });
            });
            document.getElementById('country-list-output').appendChild(ul);
        }
        else { }
    });

});