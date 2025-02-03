# Оповещения OpenProject в Telegram
<img src="/preview.png" height=350></img>
## Установка
1. `git clone gerrustalker/openproject-webhooks-telegram`
2. `cd openproject-webhooks-telegram`
3. `npm i`
4. Откройте `config.js`, и замените все значения на ваши
   * Для создания API токена OpenProject, откройте `Настройки учетной записи` -> `Маркеры доступа` -> `+ Токен API` (`/my/access_token`)
   * Для создания бота Telegram, используйте [@BotFather](https://t.me/BotFather)
   * Для получения `ChatID`, добавьте бота в нужный вам канал/чат и напишите в него любое сообщение, затем откройте `https://api.telegram.org/botТОКЕН_ВАШЕГО_БОТА/getUpdates` и возьмите `chat` -> `id`
5. В OpenProject откройте `Администрирование` -> `API и вебхуки` -> `Вебхуки` -> `+ Вебхук` (`/admin/settings/webhooks`)
6. В поле `URL-адрес загрузки` введите прямую ссылку (стандартный порт `:8565`)/reverse proxy до вашего сервера и добавьте `/meow/rawr/hewwo/op`, например `http://123.45.6.78:8565/meow/rawr/hewwo/op`
7. Укажите нужные вам события (см. [Поддерживаемые события](#поддерживаемые-события))
8. Укажите проекты, оповещения о которых вы хотите (или все)

## Поддерживаемые события
* Пакет работ: `Обновление`, `Создан`
