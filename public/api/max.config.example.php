<?php
/**
 * MAX — уведомления о новых заявках.
 * Скопируйте как max.config.php на сервер (не в git).
 */
return [
    'enabled' => true,
    'api_base_url' => 'https://platform-api2.max.ru',
    'bot_token' => 'PASTE_YOUR_MAX_BOT_TOKEN_HERE',
    'recipient_user_id' => 0,
    'recipient_chat_id' => null,
    'timeout_sec' => 12,
];
