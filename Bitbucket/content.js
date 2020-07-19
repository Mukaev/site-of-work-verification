// ДБ
function createIFrame(ip) {
  // создаем iframe
  let iframe = document.createElement('iframe');
  // настраиваем стили
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.right = '0';
  iframe.style.background = '#ffffff';
  iframe.style.zIndex = '10000';
  iframe.style.width = '120px';
  iframe.style.height = '40px';
  iframe.style.border = '0';
  iframe.style.textAlign = 'center';
  iframe.style.verticalAlign = 'middle';
  // внутреннее содержимое = ip
  iframe.srcdoc = ip;
  // вставляем в начале страницы
  document.body.insertBefore(iframe, document.body.firstChild);
  // добавляем обработчик события нажатия кнопки мыши
  // по которому содержимое iframe выделяется и копируется
  // в буфер обмена
  iframe = document.getElementsByTagName('iframe')[0];
  setTimeout(
    () => {
      iframe.contentDocument.body.addEventListener('click', () => {
        iframe.contentDocument.designMode = "on";
        iframe.contentDocument.execCommand("selectAll", false, null);
        iframe.contentDocument.execCommand("copy", false, null);
        iframe.contentDocument.designMode = "off";      
      });
    }, 1000);
}
// обработчик сообщений от background.js
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    // обработчик события нажатия кнопки мыши
    if (request.message === "clicked_browser_action") {
      // создаем запрос на сервис получения IP адреса
      fetch('https://api.ipify.org').then(res => {
        return res.blob();
      }).then(blob => blob.text()).then(text => {
        // адрес получен, сохраняем его в хранилище
        ip = text;
        chrome.storage.local.set({ key: ip }, function () {
        });
       
        createIFrame(ip);
      }).catch(err => console.log(err));

    }
  }
);
// обработчик события загрузки окна
window.onload = function () {
  // пытаемся получить из хранилища значение IP адреса
  // и в случае успеха  ДАЙ БОГ создаем iframe
  chrome.storage.local.get(["key"], function (data) {
    console.log(data.key);
    ip = data.key;
    if (ip === null || ip === undefined) return;
    createIFrame(ip);
  });
}

