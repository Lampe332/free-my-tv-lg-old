/*
 * On-screen text in Portuguese, English, Spanish, German and Russian (the same copy as the Android app).
 * tr(pt, en, es): the text in the current language. The language follows the TV unless set in Home Settings.
 */
var I18N = (function () {
  'use strict';

  var lang = 'en';
  var german = {
    "Live TV": "Live-TV",
    "All Apps": "Alle Apps",
    "Settings": "Einstellungen",
    "Home Settings": "Startbildschirm",
    "TV Settings": "TV-Einstellungen",
    "HDMI Inputs": "HDMI-Eingänge",
    "Inputs": "Eingänge",
    "Shortcuts": "Verknüpfungen",
    "Weather": "Wetter",
    "No weather data right now.": "Gerade keine Wetterdaten.",
    "Sunrise ": "Sonnenaufgang ",
    "Sunset ": "Sonnenuntergang ",
    "Crypto": "Krypto",
    "24h change": "Änderung in 24 h",
    "For You": "Für dich",
    "Couldn't open ": "Konnte nicht öffnen: ",
    "Couldn't open TV Settings": "Die TV-Einstellungen ließen sich nicht öffnen",
    "Dollar": "Dollar",
    "Series": "Serie",
    "Language": "Sprache",
    "Moving wallpaper": "Bewegter Hintergrund",
    "Animations": "Animationen",
    "Quick": "Schnell",
    "Normal": "Normal",
    "Devices on Home": "Geräte auf dem Start",
    "Screensaver": "Bildschirmschoner",
    "apps": "Apps",
    "Automatic follows the sunset: light by day, dark at night.": "Automatisch folgt dem Sonnenuntergang: tagsüber hell, nachts dunkel.",
    "The wallpaper drifts slowly and holds still while you use the remote.": "Der Hintergrund bewegt sich langsam und hält still, während du die Fernbedienung benutzt.",
    "Quick makes every move shorter, for a slower TV.": "Schnell macht jede Bewegung kürzer, gut für einen langsameren Fernseher.",
    "Cards for what is plugged into the TV: OK switches to it.": "Karten für die angeschlossenen Geräte: OK schaltet direkt um.",
    "The weather for your city on Home.": "Das Wetter für deinen Ort auf dem Startbildschirm.",
    "Crypto prices at the top and in the drawer.": "Krypto-Kurse oben und in der unteren Leiste.",
    "News": "Nachrichten",
    "The latest SRF News headlines on Home.": "Die neuesten Schlagzeilen von SRF News auf dem Startbildschirm.",
    "No news right now.": "Gerade keine Nachrichten.",
    "Loading the news …": "Nachrichten werden geladen …",
    "Just now": "Gerade eben",
    "Tomorrow": "Morgen",
    "Look": "Aussehen",
    "Home": "Startbildschirm",
    "System": "System",
    "Move apps": "Apps verschieben",
    "← → change the shelf's order, ↓ takes an app off. Or hold OK on an app on Home.": "← → ändern die Reihenfolge der Leiste, ↓ nimmt eine App heraus. Oder auf dem Startbildschirm OK auf einer App gedrückt halten.",
    "While it's on, the TV's own stays off.": "Solange er an ist, bleibt der Bildschirmschoner des Fernsehers aus.",
    "Home key": "Home-Taste",
    "In an app opened here, Home comes back here; Home again goes to LG's home screen.": "In einer hier geöffneten App bringt Home dich hierher zurück, Home ein zweites Mal zur LG-Startseite.",
    "For this the TV has to let this app see once which app is in front. OK asks it again.": "Dafür muss der Fernseher dieser App einmal erlauben zu sehen, welche App vorne ist. OK fragt ihn nochmal.",
    "Allow it on the TV.": "Bitte am Fernseher erlauben.",
    "Starts after": "Startet nach",
    "Show it now": "Jetzt zeigen",
    "The time and the weather on the dark wallpaper, until the next key.": "Uhr und Wetter auf dem dunklen Hintergrund, bis zur nächsten Taste.",
    "OK changes · ← → choose · Back closes": "OK ändert · ← → wählen · Zurück schließt",
    "← → move · ↓ take off · OK done": "← → verschieben · ↓ entfernen · OK fertig",
    "Automatic follows the TV.": "Automatisch folgt der Sprache des Fernsehers.",
    "Automatic follows your country.": "Automatisch folgt deinem Land.",
    "After how long without a key the screen goes dark. Good for an OLED.": "Nach wie langer Zeit ohne Tastendruck der Bildschirm dunkel wird. Gut für OLED.",
    "The TV's own settings.": "Die Einstellungen des Fernsehers.",
    "Temperature": "Temperatur",
    "Theme": "Design",
    "Automatic": "Automatisch",
    "Light": "Hell",
    "Dark": "Dunkel",
    "Quotes widget": "Kurs-Widget",
    "On": "An",
    "Off": "Aus",
    "On · ": "In der Leiste · ",
    "Explore": "Entdecken",
    "Movies": "Filme",
    "Shows": "Serien",
    "Clear": "Klar",
    "Mostly Sunny": "Überwiegend sonnig",
    "Mostly Clear": "Überwiegend klar",
    "Partly Cloudy": "Teilweise bewölkt",
    "Cloudy": "Bewölkt",
    "Fog": "Nebel",
    "Drizzle": "Nieselregen",
    "Heavy Rain": "Starker Regen",
    "Snow": "Schnee",
    "Thunderstorms": "Gewitter",
    "Rain": "Regen"
  };

  /** German by the English; text built at runtime by its English pattern. */
  function germanText(en) {
    if (Object.prototype.hasOwnProperty.call(german, en)) return german[en];
    var m = /^(\d+) (min|h) ago$/.exec(en);
    if (m) return 'vor ' + m[1] + (m[2] === 'min' ? ' Min.' : ' Std.');
    m = /^(\d+) seasons?$/.exec(en);
    if (m) return m[1] + (m[1] === '1' ? ' Staffel' : ' Staffeln');
    m = /^H:(\S+)(\s+)L:(\S+)$/.exec(en);
    if (m) return 'Max. ' + m[1] + ' · Min. ' + m[3];
    m = /^The shelf holds up to (\d+) apps\.$/.exec(en);
    if (m) return 'In die Leiste passen bis zu ' + m[1] + ' Apps.';
    m = /^(.+) is on the shelf now\.$/.exec(en);
    if (m) return m[1] + ' ist jetzt in der Leiste.';
    m = /^(.+) is off the shelf: hold OK on it in All Apps to bring it back\.$/.exec(en);
    if (m) return m[1] + ' ist aus der Leiste. In „Alle Apps“ OK darauf halten holt sie zurück.';
    return en;
  }

  var russian = {
    "Live TV": "Телеканалы",
    "All Apps": "Приложения",
    "Settings": "Настройки",
    "The latest SRF News headlines on Home.": "Свежие заголовки SRF News на главном экране.",
    "No news right now.": "Сейчас нет новостей.",
    "Loading the news …": "Загружаем новости …",
    "Just now": "Только что",
    "Tomorrow": "Завтра",
    "Look": "Внешний вид",
    "Home": "Главный экран",
    "System": "Система",
    "Move apps": "Переставить приложения",
    "← → change the shelf's order, ↓ takes an app off. Or hold OK on an app on Home.": "← → меняют порядок избранного, ↓ убирает приложение. Или удерживайте OK на приложении на главном экране.",
    "While it's on, the TV's own stays off.": "Пока она включена, заставка телевизора не появляется.",
    "Home key": "Кнопка «Домой»",
    "In an app opened here, Home comes back here; Home again goes to LG's home screen.": "В приложении, открытом отсюда, «Домой» возвращает сюда, повторное нажатие — на главный экран LG.",
    "For this the TV has to let this app see once which app is in front. OK asks it again.": "Для этого телевизор должен один раз разрешить приложению видеть, какое приложение открыто. OK спросит снова.",
    "Allow it on the TV.": "Разрешите на телевизоре.",
    "Starts after": "Включается через",
    "Show it now": "Показать сейчас",
    "The time and the weather on the dark wallpaper, until the next key.": "Время и погода на тёмном фоне до следующего нажатия.",
    "OK changes · ← → choose · Back closes": "OK меняет · ← → выбирают · Назад закрывает",
    "← → move · ↓ take off · OK done": "← → переставить · ↓ убрать · OK готово",
    "Home Settings": "Главный экран",
    "TV Settings": "Настройки ТВ",
    "HDMI Inputs": "Входы HDMI",
    "Inputs": "Входы",
    "Shortcuts": "Ярлыки",
    "Weather": "Погода",
    "No weather data right now.": "Сейчас нет данных о погоде.",
    "Sunrise ": "Восход ",
    "Sunset ": "Закат ",
    "Crypto": "Криптовалюты",
    "24h change": "изменение за 24 ч",
    "For You": "Для вас",
    "Couldn't open ": "Не удалось открыть ",
    "Dollar": "Доллар",
    "Series": "Сериал",
    "now": "сейчас",
    "Language": "Язык",
    "Temperature": "Температура",
    "Theme": "Тема",
    "Automatic": "Автоматически",
    "Light": "Светлая",
    "Dark": "Тёмная",
    "Quotes widget": "Виджет котировок",
    "On": "Вкл.",
    "Off": "Выкл.",
    "Explore": "Обзор",
    "Movies": "Фильмы",
    "Shows": "Сериалы",
    "Clear": "Ясно",
    "Mostly Sunny": "Малооблачно",
    "Mostly Clear": "Малооблачно",
    "Partly Cloudy": "Переменная облачность",
    "Cloudy": "Облачно",
    "Fog": "Туман",
    "Drizzle": "Морось",
    "Heavy Rain": "Сильный дождь",
    "Snow": "Снег",
    "Thunderstorms": "Гроза",
    "Rain": "Дождь",
    "On · ": "В избранном · ",
    "Couldn't open TV Settings": "Не удалось открыть настройки телевизора",
    "Action & Adventure": "Боевик и приключения",
    "Sci-Fi & Fantasy": "Фантастика и фэнтези",
    "War & Politics": "Война и политика",
    "Kids": "Для детей",
    "News": "Новости",
    "Soap": "Мыльная опера",
    "Talk": "Ток-шоу",
    "": ""
  };

  function russianText(en) {
    if (Object.prototype.hasOwnProperty.call(russian, en)) return russian[en];
    var m = /^(\d+) (min|h) ago$/.exec(en);
    if (m) return m[1] + (m[2] === 'min' ? ' мин назад' : ' ч назад');
    m = /^The shelf holds up to (\d+) apps\.$/.exec(en);
    if (m) return 'В избранное можно добавить не более ' + m[1] + ' приложений.';
    m = /^(.+) is on the shelf now\.$/.exec(en);
    if (m) return m[1] + ' теперь в избранном.';
    m = /^(.+) is off the shelf: hold OK on it in All Apps to bring it back\.$/.exec(en);
    if (m) return m[1] + ' убрано из избранного. Удерживайте OK на нём во «Всех приложениях», чтобы вернуть.';
    return en;
  }

  function detect(setting) {
    var v = (setting || 'auto').toLowerCase();
    if (v === 'auto') v = (navigator.language || 'en').toLowerCase();
    return v.indexOf('ru') === 0 ? 'ru' : v.indexOf('de') === 0 ? 'de' : v.indexOf('pt') === 0 ? 'pt' : v.indexOf('es') === 0 ? 'es' : 'en';
  }

  return {
    set: function (setting) { lang = detect(setting); document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang; },
    count: function (n, one, few, many) {
      var last = Math.abs(n % 100);
      return n + ' ' + (last >= 11 && last <= 14 ? many : last % 10 === 1 ? one : last % 10 >= 2 && last % 10 <= 4 ? few : many);
    },
    get lang() { return lang; },
    tr: function (pt, en, es) { return lang === 'ru' ? russianText(en) : lang === 'de' ? germanText(en) : lang === 'es' ? (es || en) : lang === 'en' ? en : pt; },
    /** BCP 47 tag for dates, numbers and TMDB. */
    locale: function () { return lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : 'pt-BR'; }
  };
})();

function tr(pt, en, es) {
  return I18N.tr(pt, en, es);
}
