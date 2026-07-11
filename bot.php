<?php
// --- 1. SOZLAMALAR VA BAZA ULANISHI ---

// Xatolarni yashirish (Foydalanuvchiga ko'rinmasligi uchun)
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');
error_reporting(E_ALL);

// --- KUCHAYTIRILGAN SOZLAMALAR (10GB RAM) ---
ini_set('memory_limit', '10240M'); // 10 GB RAM ajratildi
set_time_limit(3600);              // 1 soatgacha ishlashga ruxsat
ignore_user_abort(true);           // Foydalanuvchi chiqib ketsa ham jarayon to'xtamaydi

// --- MYSQL SOZLAMALARI ---
define('DB_HOST', 'localhost');
define('DB_USER', '692b3496c861f_pdf');      // Baza foydalanuvchisi
define('DB_PASS', '190919');                 // Baza paroli
define('DB_NAME', '692b3496c861f_pdf');      // Baza nomi

// --- BOT SOZLAMALARI ---
define('BOT_TOKEN', '8548026474:AAEqJmhwRKCKfrODbi1b8kFo5G6IM-weI5w');
define('BOT_USERNAME', '@PdfZipMasterBot'); // <-- BU YERGA BOT USERNAME
define('ADMIN_ID', '7524804094'); 
define('API_URL', 'https://api.telegram.org/bot' . BOT_TOKEN . '/');
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('ASSETS_DIR', __DIR__ . '/assets/');
define('FILE_LIFETIME', 3600); // 1 soat

// FPDF ulanishi
if (file_exists('fpdf.php')) { require_once('fpdf.php'); }

// Papkalar
if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
if (!is_dir(ASSETS_DIR)) mkdir(ASSETS_DIR, 0755, true);

// Baza ulanishini hosil qilish (PDO)
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // --- JADVALLARNI AVTOMATIK YARATISH ---
    $sql_setup = "
        CREATE TABLE IF NOT EXISTS `users` (
          `chat_id` bigint(20) NOT NULL,
          `full_name` varchar(255) DEFAULT NULL,
          `username` varchar(255) DEFAULT NULL,
          `mode` varchar(50) DEFAULT NULL,
          `last_msg_id` int(11) DEFAULT NULL,
          `admin_login_id` int(11) DEFAULT NULL,
          `finished` tinyint(1) DEFAULT 0,
          `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`chat_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS `channels` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `channel_id` varchar(100) NOT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS `settings` (
          `setting_key` varchar(50) NOT NULL,
          `setting_value` varchar(255) DEFAULT NULL,
          PRIMARY KEY (`setting_key`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS `auto_delete` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `chat_id` bigint(20) NOT NULL,
          `message_id` int(11) NOT NULL,
          `delete_time` int(11) NOT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    
    $pdo->exec($sql_setup);
    $pdo->exec("INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`) VALUES ('subscription_active', '0')");

} catch (PDOException $e) {
    die("Bazaga ulanishda xatolik: " . $e->getMessage());
}

// Garbage Collector (Har 20-chi so'rovda ishlaydi)
if (rand(1, 20) == 1) {
    cleanOldSessions();
    cleanExpiredMessages(); // Guruhdagi eski xabarlarni o'chirish
}

$content = file_get_contents("php://input");
$update = json_decode($content, true);

if (!$update) {
    echo "<h2>Bot Ishlamoqda! (Guruh cheklovi + 10GB RAM)</h2>";
    exit;
}

// --- 2. FOYDALANUVCHINI ANIQLASH VA BAZAGA YOZISH ---

$message = $update['message'] ?? null;
$callback_query = $update['callback_query'] ?? null;

if ($message) {
    $chat_id = $message['chat']['id'];
    $chat_type = $message['chat']['type'];
    $text = $message['text'] ?? null;
    $full_name = ($message['chat']['first_name'] ?? '') . ' ' . ($message['chat']['last_name'] ?? '');
    $username = $message['chat']['username'] ?? null;
} elseif ($callback_query) {
    $chat_id = $callback_query['message']['chat']['id'];
    $chat_type = $callback_query['message']['chat']['type'];
    $text = $callback_query['data'];
    $message_id = $callback_query['message']['message_id'];
    $full_name = ''; 
    $username = null;
} else {
    exit;
}

// --- GURUHLARDA ISHLASHNI CHEKLASH (O'ZGARTIRILDI) ---
if ($chat_type !== 'private') {
    // Faqat /start buyrug'iga javob beramiz
    // Tekshiramiz: matn /start ga tengmi yoki /start@BotUsername bilan boshlanadimi
    if ($text === '/start' || strpos($text, '/start@') === 0) {
        
        $msg_text = "<b>⚠️ Diqqat!</b>\n\nMen faqat shaxsiy yozishmalarda ishlayman.\nDOCX, PDF, ZIP  filelari bilan iishlay olaman\n Fayllaringizni konvertatsiya qilish uchun shaxsiyga o'ting.";
        
        // Linkni to'g'irlash (@ belgisini olib tashlab link yasaymiz)
        $bot_username_clean = str_replace('@', '', BOT_USERNAME);
        $bot_link = "https://t.me/" . $bot_username_clean;
        
        $kb = json_encode(['inline_keyboard' => [[['text' => " Botga o'tish", 'url' => $bot_link]]]]);
        
        // Xabar yuborish
        $res = request('sendMessage', [
            'chat_id' => $chat_id, 
            'text' => $msg_text, 
            'parse_mode' => 'HTML', 
            'reply_markup' => $kb
        ]);
        
        $res_arr = json_decode($res, true);
        
        // Agar xabar ketgan bo'lsa, faqat shu xabarni o'chirishga navbatga qo'yamiz
        if ($res_arr['ok']) {
            $sent_msg_id = $res_arr['result']['message_id'];
            // 60 soniyadan keyin o'chiriladi (guruhni toza saqlash uchun)
            db_addAutoDelete($chat_id, $sent_msg_id, time() + 60);
        }
    }
    
    // Muhim: Guruhda boshqa har qanday holatda bot to'xtaydi (exit)
    exit; 
}

// Foydalanuvchini bazadan olish yoki yaratish
$user = db_getUser($chat_id);
if (!$user) {
    db_createUser($chat_id, $full_name, $username);
    $user = db_getUser($chat_id);
}

// Foydalanuvchi papkasi
$user_dir = UPLOAD_DIR . $chat_id . '/';
if (!is_dir($user_dir)) {
    mkdir($user_dir, 0755, true);
    file_put_contents($user_dir . '.htaccess', "Deny from all");
}

try {
    // ==========================================
    //          ADMIN PANEL (2501)
    // ==========================================

    if ($text === '2501' && $chat_id == ADMIN_ID) {
        db_updateUser($chat_id, ['mode' => 'admin_main', 'admin_login_id' => $message['message_id']]);
        showAdminHome($chat_id);
        exit;
    }

    // Admin Harakatlari
    if ($chat_id == ADMIN_ID && isset($user['mode']) && strpos($user['mode'], 'admin_') === 0) {
        
        // 1. Asosiy Menyu harakatlari
        if ($user['mode'] == 'admin_main') {
            if ($text == 'CHIQISH') {
                if ($user['admin_login_id']) {
                    for ($i = $user['admin_login_id']; $i <= $message['message_id']; $i++) {
                        request('deleteMessage', ['chat_id' => $chat_id, 'message_id' => $i]);
                    }
                }
                db_updateUser($chat_id, ['mode' => null, 'admin_login_id' => null]);
                showMainMenu($chat_id); 
                exit; 
            }
            elseif ($text == 'XABAR YUBORISH') {
                db_updateUser($chat_id, ['mode' => 'admin_broadcast']);
                request('sendMessage', [
                    'chat_id' => $chat_id, 
                    'text' => "<b>Tarqatma xabar matnini yozing:</b>\n\n<i>Rasm, video yoki istalgan fayl yuborishingiz mumkin.</i>", 
                    'parse_mode' => 'HTML',
                    'reply_markup' => json_encode(['keyboard' => [[['text' => 'BEKOR QILISH']]], 'resize_keyboard' => true])
                ]);
                exit;
            }
            elseif ($text == 'MAJBURIY OBUNA') {
                db_updateUser($chat_id, ['mode' => 'admin_sub_hub']);
                showSubscriptionHub($chat_id);
                exit;
            }
            elseif ($text == 'STATISTIKA') {
                $stats = db_getStats();
                $msg = "<b>BOT STATISTIKASI</b>\n\n";
                $msg .= "Jami foydalanuvchilar: <b>{$stats['total']}</b> ta\n";
                $msg .= "Bugungi yangi (24s): <b>{$stats['today']}</b> ta\n";
                $msg .= "Server vaqti: " . date("H:i:s");
                
                request('sendMessage', ['chat_id' => $chat_id, 'text' => $msg, 'parse_mode' => 'HTML']);
                exit;
            }
        }

        // 2. Obuna Boshqaruv Markazi
        elseif ($user['mode'] == 'admin_sub_hub') {
            if ($text == 'ORQAGA') {
                db_updateUser($chat_id, ['mode' => 'admin_main']);
                showAdminHome($chat_id);
                exit;
            }
            elseif ($text == 'KANAL QO\'SHISH') {
                db_updateUser($chat_id, ['mode' => 'admin_add_channel']);
                request('sendMessage', [
                    'chat_id' => $chat_id,
                    'text' => "<b>Kanal qo'shish</b>\n\nKanalning <b>Username</b> (@kanal) yoki <b>ID</b> raqamini yuboring.\n\n<i>Eslatma: Bot kanalda Admin bo'lishi shart!</i>",
                    'parse_mode' => 'HTML',
                    'reply_markup' => json_encode(['keyboard' => [[['text' => 'BEKOR QILISH']]], 'resize_keyboard' => true])
                ]);
                exit;
            }
            elseif ($text == 'KANAL O\'CHIRISH') {
                $channels = db_getChannels();
                if (empty($channels)) {
                    request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>Xato:</b> O'chirish uchun kanallar mavjud emas.", 'parse_mode' => 'HTML']);
                } else {
                    $txt = "<b>Qaysi kanalni o'chirmoqchisiz?</b>\n\nTanlang:";
                    $kb = [];
                    foreach ($channels as $ch) {
                        $kb[] = [['text' => "O'CHIRISH: " . $ch['channel_id'], 'callback_data' => "sub_del_" . $ch['id']]];
                    }
                    request('sendMessage', [
                        'chat_id' => $chat_id, 
                        'text' => $txt, 
                        'parse_mode' => 'HTML', 
                        'reply_markup' => json_encode(['inline_keyboard' => $kb])
                    ]);
                }
                exit;
            }
            elseif ($text == 'O\'CHIRISH' || $text == 'YOQISH') {
                $current = db_getSetting('subscription_active');
                $new_status = $current ? '0' : '1';
                db_setSetting('subscription_active', $new_status);
                
                $status_text = $new_status ? "YOQILDI" : "O'CHIRILDI";
                request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>Bajarildi:</b> Obuna tizimi <b>$status_text</b>." , 'parse_mode' => 'HTML']);
                showSubscriptionHub($chat_id); 
                exit;
            }
        }
        
        // 3. Xabar Yuborish (Backgroundda ketadi)
        elseif ($user['mode'] == 'admin_broadcast') {
            if ($text == 'BEKOR QILISH') {
                db_updateUser($chat_id, ['mode' => 'admin_main']);
                showAdminHome($chat_id);
                exit;
            }
            
            // Xabar yuborish uzoq vaqt olishi mumkin, shuning uchun connectionni uzamiz
            request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>Xabar yuborish boshlandi...</b> (Orqa fonda)", 'parse_mode' => 'HTML']);
            closeConnection(); // Telegramga javob qaytarib, ishni davom ettiramiz

            $stmt = $pdo->query("SELECT chat_id FROM users");
            $all_users = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $count = 0;
            foreach ($all_users as $uid) {
                if ($uid == $chat_id) continue;
                $res = request('copyMessage', ['chat_id' => $uid, 'from_chat_id' => $chat_id, 'message_id' => $message['message_id']]);
                if (json_decode($res, true)['ok']) $count++;
            }
            
            request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>Hisobot:</b> Xabar muvaffaqiyatli <b>$count</b> ta odamga yetib bordi.", 'parse_mode' => 'HTML']);
            db_updateUser($chat_id, ['mode' => 'admin_main']);
            // showAdminHome($chat_id); // Bu yerda kerak emas, chunki connection yopilgan
            exit;
        }

        // 4. Kanal qo'shish
        elseif ($user['mode'] == 'admin_add_channel') {
            if ($text == 'BEKOR QILISH') {
                db_updateUser($chat_id, ['mode' => 'admin_sub_hub']);
                showSubscriptionHub($chat_id);
                exit;
            }
            
            if (strpos($text, '@') !== 0 && !is_numeric($text)) {
                 request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>Xato:</b> Iltimos, kanal username (@bilan) yoki ID raqamini to'g'ri yozing.", 'parse_mode' => 'HTML']);
                 exit;
            }

            $check = request('getChatMember', ['chat_id' => $text, 'user_id' => explode(':', BOT_TOKEN)[0]]);
            $res = json_decode($check, true);
            
            if (!$res || !$res['ok'] || !in_array($res['result']['status'], ['administrator', 'creator'])) { 
                request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>Xatolik!</b>\nBot ushbu kanalda Admin emas. Iltimos, avval botni kanalga qo'shib, admin huquqini bering.", 'parse_mode' => 'HTML']);
                exit;
            }

            db_addChannel($text);
            request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>Muvaffaqiyatli:</b> Kanal <b>$text</b> qo'shildi!", 'parse_mode' => 'HTML']);
            
            db_updateUser($chat_id, ['mode' => 'admin_sub_hub']);
            showSubscriptionHub($chat_id);
            exit;
        }
    }

    // Admin Callbacklari
    if ($callback_query && $chat_id == ADMIN_ID) {
        if (strpos($text, 'sub_del_') === 0) {
            $ch_id_db = (int)substr($text, 8);
            db_deleteChannel($ch_id_db);
            request('answerCallbackQuery', ['callback_query_id' => $callback_query['id'], 'text' => "Kanal o'chirildi!"]);
            request('deleteMessage', ['chat_id' => $chat_id, 'message_id' => $message_id]);
            request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>O'chirildi:</b> Kanal ro'yxatdan olib tashlandi.", 'parse_mode' => 'HTML']);
        }
    }

    // ==========================================
    //          MAJBURIY OBUNA TEKSHIRUVI
    // ==========================================
    
    if ($chat_id != ADMIN_ID) {
        if ($callback_query && $text == 'check_sub') {
            $check = checkUserSubscription($chat_id);
            if ($check['status'] === true) {
                request('answerCallbackQuery', ['callback_query_id' => $callback_query['id'], 'text' => "Rahmat! Botdan foydalanishingiz mumkin."]);
                request('deleteMessage', ['chat_id' => $chat_id, 'message_id' => $message_id]);
                showMainMenu($chat_id); 
                exit;
            } else {
                request('answerCallbackQuery', ['callback_query_id' => $callback_query['id'], 'text' => "Hali to'liq a'zo bo'lmadingiz!", 'show_alert' => true]);
                exit;
            }
        }

        $check = checkUserSubscription($chat_id);
        if ($check['status'] === false) {
            if ($callback_query) {
                request('answerCallbackQuery', ['callback_query_id' => $callback_query['id'], 'text' => "Iltimos, avval kanallarga a'zo bo'ling!", 'show_alert' => true]);
                exit;
            }
            
            $btn_list = [];
            foreach ($check['missing'] as $ch) {
                $link = (strpos($ch, '@') === 0) ? "https://t.me/" . substr($ch, 1) : "#";
                $btn_list[] = [['text' => "A'ZO BO'LISH", 'url' => $link]];
            }
            $btn_list[] = [['text' => "TEKSHIRISH", 'callback_data' => 'check_sub']];
            
            request('sendMessage', [
                'chat_id' => $chat_id,
                'text' => "<b>Assalomu alaykum!</b>\n\nBotimizdan bepul foydalanish uchun homiy kanallarimizga a'zo bo'lishingizni so'raymiz. Bu bizning rivojlanishimiz uchun muhim.\n\n<i>Quyidagi kanallarga qo'shiling va \"TEKSHIRISH\" tugmasini bosing:</i>",
                'parse_mode' => 'HTML',
                'reply_markup' => json_encode(['inline_keyboard' => $btn_list])
            ]);
            exit; 
        }
    }

    // ==========================================
    //          FOYDALANUVCHI LOGIKASI
    // ==========================================
    
    if ($text == '/start' || $text == '/clear' || $text == 'BOSH MENYU' || $text == 'ORQAGA') {
        clearUserFiles($user_dir);
        db_resetUser($chat_id);
        showMainMenu($chat_id);
        exit;
    }

    if ($text == "RASM -> PDF") { 
        db_updateUser($chat_id, ['mode' => 'pdf']);
        request('sendMessage', [
            'chat_id' => $chat_id, 
            'text' => "<b>Rasm -> PDF Rejimi</b>\n\nMarhamat, rasmlaringizni menga yuboring. Men ularni birlashtirib, chiroyli <b>PDF kitob</b> qilib beraman.\n\n<i>Boshlash uchun birinchi rasmni tashlang!</i>",
            'parse_mode' => 'HTML',
            'reply_markup' => json_encode(['keyboard' => [[['text' => 'BOSH MENYU']]], 'resize_keyboard' => true])
        ]);
        exit;
    }

    if ($text == "FAYL -> ZIP") { 
        db_updateUser($chat_id, ['mode' => 'zip']);
        request('sendMessage', [
            'chat_id' => $chat_id, 
            'text' => "<b>Arxivlash Rejimi</b>\n\nIstalgan turdagi fayllarni yuboring (hujjat, musiqa, video). Men ularni ixcham <b>ZIP arxivga</b> joylab beraman.\n\n<i>Fayllarni yuklashni boshlang!</i>",
            'parse_mode' => 'HTML',
            'reply_markup' => json_encode(['keyboard' => [[['text' => 'BOSH MENYU']]], 'resize_keyboard' => true])
        ]);
        exit;
    }

    if ($text == "TUIT TITUL") {
        $file_path = ASSETS_DIR . 'tuit_titul.docx';
        if (file_exists($file_path)) {
            sendDocument($chat_id, $file_path, "TUIT_TITUL.docx", "<b>Marhamat:</b> So'ragan titul varaq namunangiz.");
        } else {
            request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>Uzr:</b> Hozircha serverda bu fayl mavjud emas.", 'parse_mode' => 'HTML']);
        }
        exit;
    }

    if ($text == "MATN -> DOCX") {
        db_updateUser($chat_id, ['mode' => 'text_to_doc']);
        request('sendMessage', [
            'chat_id' => $chat_id, 
            'text' => "<b>Matn Muharriri</b>\n\nMenga matn yuboring (yoki nusxa ko'chirib tashlang). Men uni sizga <b>Word (.docx)</b> hujjati ko'rinishida qaytarib beraman.",
            'parse_mode' => 'HTML',
            'reply_markup' => json_encode(['keyboard' => [[['text' => 'BOSH MENYU']]], 'resize_keyboard' => true])
        ]);
        exit;
    }

    if ($user['mode'] == 'text_to_doc' && $text && $text != 'BOSH MENYU') {
        $doc_content = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Hujjat</title></head><body>" . nl2br($text) . "</body></html>";
        $doc_path = $user_dir . "hujjat.doc";
        file_put_contents($doc_path, $doc_content);
        
        sendDocument($chat_id, $doc_path, "matn_hujjat.doc", "<b>Tayyor!</b> Matningiz faylga aylantirildi.");
        clearUserFiles($user_dir);
        db_resetUser($chat_id);
        exit;
    }

    // Nomni o'zgartirish
    if (isset($message['reply_to_message']) && $text) {
        $new_name = preg_replace('/[^a-zA-Z0-9_\-\p{Cyrillic}\s]/u', '', $text);
        $new_name = trim($new_name) ?: date('d-m-Y');

        // Reply qilinganda ham connectionni uzib, keyin ishlaymiz (agar katta fayl bo'lsa)
        request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>Qayta ishlanmoqda...</b>", 'parse_mode' => 'HTML']);
        closeConnection();

        if (countFiles($user_dir) > 0) {
            $has_images = count(glob($user_dir . "*___*.{jpg,jpeg,png}", GLOB_BRACE)) > 0;
            if ($has_images) createAndSendPDF($chat_id, $user_dir, $new_name, "<b>Bajarildi:</b> Faylingiz yangi nom bilan tayyor!");
            else createAndSendZIP($chat_id, $user_dir, $new_name, "<b>Bajarildi:</b> Arxiv yangi nom bilan tayyor!");
        } else {
            // Agar fayl yo'q bo'lsa, baribir xabar boradi
            request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>Xato:</b> Fayllaringizni topa olmadim. Iltimos, qaytadan yuklang.", 'parse_mode' => 'HTML']);
        }
        exit;
    }

    // Tugatish (Callback) - ENG MUHIM QISM (Background Process)
    if ($callback_query && $text == "finish_upload") {
        request('answerCallbackQuery', ['callback_query_id' => $callback_query['id']]);
        $filename = date('d-m-Y');
        
        request('editMessageText', [
            'chat_id' => $chat_id,
            'message_id' => $message_id,
            'text' => "<b>Jarayon ketmoqda...</b>\n\nKatta fayllarni birlashtirish biroz vaqt olishi mumkin. Iltimos, kuting, natijani albatta yuboraman!",
            'parse_mode' => 'HTML'
        ]);

        // TELEGRAM BILAN ALOQANI UZAMIZ (200 OK), LEKIN ISHNI DAVOM ETTIRAMIZ
        closeConnection();

        // Bu yerdan pastdagi kod 10GB RAM bilan bemalol ishlayveradi
        $has_images = false;
        if (glob($user_dir . "*___*.jpg") || glob($user_dir . "*___*.jpeg") || glob($user_dir . "*___*.png")) {
            $has_images = true;
        }
        
        if ($has_images && ($user['mode'] == 'pdf' || $user['mode'] == null)) {
             createAndSendPDF($chat_id, $user_dir, $filename);
        } else {
             createAndSendZIP($chat_id, $user_dir, $filename);
        }

        db_updateUser($chat_id, ['finished' => 1]);
        request('deleteMessage', ['chat_id' => $chat_id, 'message_id' => $message_id]);
        exit;
    }

    // Fayl yuklash
    if (isset($message['photo']) || isset($message['document']) || isset($message['video']) || 
        isset($message['audio']) || isset($message['voice']) || isset($message['video_note']) || 
        isset($message['animation'])) {
        
        if (file_exists($user_dir . 'output.pdf') || file_exists($user_dir . 'output.zip') || $user['finished']) {
            clearUserFiles($user_dir);
            db_updateUser($chat_id, ['finished' => 0]);
        }

        $is_photo = isset($message['photo']);
        
        if ($user['mode'] === null) {
            db_updateUser($chat_id, ['mode' => $is_photo ? 'pdf' : 'zip']);
            $user['mode'] = $is_photo ? 'pdf' : 'zip'; 
        } elseif ($user['mode'] == 'pdf' && !$is_photo) {
            db_updateUser($chat_id, ['mode' => 'zip']);
            $user['mode'] = 'zip';
        }

        $file_id = null;
        $original_name = "file_" . time();
        $ext = "";
        
        if (isset($message['document'])) {
             $file_id = $message['document']['file_id'];
             $original_name = $message['document']['file_name'] ?? $original_name;
             $ext = pathinfo($original_name, PATHINFO_EXTENSION);
        } elseif (isset($message['photo'])) {
             $file_id = end($message['photo'])['file_id'];
             $ext = "jpg";
        } elseif (isset($message['audio'])) {
             $file_id = $message['audio']['file_id'];
             $ext = "mp3";
        } elseif (isset($message['video'])) {
             $file_id = $message['video']['file_id'];
             $ext = "mp4";
        }

        if ($file_id) {
            $path_json = json_decode(request('getFile', ['file_id' => $file_id]), true);
            if (isset($path_json['result']['file_path'])) {
                $url = "https://api.telegram.org/file/bot" . BOT_TOKEN . "/" . $path_json['result']['file_path'];
                $clean_name = preg_replace('/[^a-zA-Z0-9_\-\p{Cyrillic}\.]/u', '_', $original_name);
                if (!$ext) $ext = "dat";
                $suffix = "." . $ext;
                if (substr(strtolower($clean_name), -strlen($suffix)) !== strtolower($suffix)) $clean_name .= $suffix;
                
                downloadFile($url, $user_dir . microtime(true) . "___" . $clean_name);
            }
            
            $count = countFiles($user_dir);
            $mode_display = ($user['mode'] == 'pdf') ? "PDF GA AYLANTIRISH" : "ARXIVLASH (ZIP)";
            $keyboard = ['inline_keyboard' => [[['text' => "YAKUNLASH va OLISH ($count)", 'callback_data' => 'finish_upload']]]];
            $status_text = "<b>$mode_display</b>\n\nQabul qilindi: <b>$count</b> ta fayl.\n\n<i>Yana fayl yuborishingiz mumkin. Barchasi yuklanib bo'lgach, tugmani bosing.</i>";

            if ($user['last_msg_id']) {
                $res = request('editMessageText', ['chat_id' => $chat_id, 'message_id' => $user['last_msg_id'], 'text' => $status_text, 'parse_mode' => 'HTML', 'reply_markup' => json_encode($keyboard)]);
                if (!json_decode($res, true)['ok']) db_updateUser($chat_id, ['last_msg_id' => null]);
            }

            if (!$user['last_msg_id'] || !json_decode($res, true)['ok']) {
                $res = request('sendMessage', ['chat_id' => $chat_id, 'text' => $status_text, 'parse_mode' => 'HTML', 'reply_markup' => json_encode($keyboard)]);
                $mid = json_decode($res, true)['result']['message_id'] ?? null;
                db_updateUser($chat_id, ['last_msg_id' => $mid]);
            }
        }
    }

} catch (Exception $e) { error_log($e->getMessage()); }

// ==========================================
//          YORDAMCHI FUNKSIYALAR
// ==========================================

// Webhook uchun connectionni uzish va orqa fonda ishlash
function closeConnection($msg = '') {
    // Agar output buffer ochiq bo'lsa, tozalaymiz
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    
    // Telegram 200 OK kutadi
    header("Connection: close");
    ignore_user_abort(true);
    ob_start();
    echo $msg;
    $size = ob_get_length();
    header("Content-Length: $size");
    header("Content-Type: text/html");
    ob_end_flush();
    flush();
    
    // Agar FastCGI bo'lsa (zamonaviy hostinglarda)
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }
}

function db_getUser($chat_id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM users WHERE chat_id = ?");
    $stmt->execute([$chat_id]);
    return $stmt->fetch();
}

function db_createUser($chat_id, $name, $username) {
    global $pdo;
    $stmt = $pdo->prepare("INSERT IGNORE INTO users (chat_id, full_name, username) VALUES (?, ?, ?)");
    $stmt->execute([$chat_id, $name, $username]);
}

function db_updateUser($chat_id, $data) {
    global $pdo;
    $fields = [];
    $values = [];
    foreach ($data as $key => $val) {
        $fields[] = "$key = ?";
        $values[] = $val;
    }
    $values[] = $chat_id;
    $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE chat_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
}

function db_resetUser($chat_id) {
    db_updateUser($chat_id, ['mode' => null, 'last_msg_id' => null, 'finished' => 0, 'admin_login_id' => null]);
}

function db_getSetting($key) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    return $stmt->fetchColumn();
}

function db_setSetting($key, $val) {
    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->execute([$key, $val, $val]);
}

function db_getChannels() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM channels");
    return $stmt->fetchAll();
}

function db_addChannel($channel_id) {
    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO channels (channel_id) VALUES (?)");
    $stmt->execute([$channel_id]);
}

function db_deleteChannel($id) {
    global $pdo;
    $stmt = $pdo->prepare("DELETE FROM channels WHERE id = ?");
    $stmt->execute([$id]);
}

function db_getStats() {
    global $pdo;
    $total = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $today = $pdo->query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL 1 DAY")->fetchColumn();
    return ['total' => $total, 'today' => $today];
}

// Avtomatik o'chirish uchun yangi funksiyalar
function db_addAutoDelete($chat_id, $message_id, $delete_time) {
    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO auto_delete (chat_id, message_id, delete_time) VALUES (?, ?, ?)");
    $stmt->execute([$chat_id, $message_id, $delete_time]);
}

function cleanExpiredMessages() {
    global $pdo;
    $now = time();
    $stmt = $pdo->prepare("SELECT * FROM auto_delete WHERE delete_time <= ?");
    $stmt->execute([$now]);
    $messages = $stmt->fetchAll();

    foreach ($messages as $msg) {
        request('deleteMessage', ['chat_id' => $msg['chat_id'], 'message_id' => $msg['message_id']]);
        $del = $pdo->prepare("DELETE FROM auto_delete WHERE id = ?");
        $del->execute([$msg['id']]);
    }
}

function checkUserSubscription($chat_id) {
    if ($chat_id == ADMIN_ID) return ['status' => true];
    
    $active = db_getSetting('subscription_active');
    if (!$active) return ['status' => true];

    $channels = db_getChannels();
    if (empty($channels)) return ['status' => true];

    $missing = [];
    foreach ($channels as $ch) {
        $res = request('getChatMember', ['chat_id' => $ch['channel_id'], 'user_id' => $chat_id]);
        $data = json_decode($res, true);
        
        if ($data && $data['ok']) {
            $status = $data['result']['status'];
            if ($status == 'left' || $status == 'kicked') {
                $missing[] = $ch['channel_id'];
            }
        } else {
            $missing[] = $ch['channel_id']; 
        }
    }
    
    if (empty($missing)) return ['status' => true];
    return ['status' => false, 'missing' => $missing];
}

function showAdminHome($chat_id) {
    $kb = [
        'keyboard' => [
            [['text' => "STATISTIKA"], ['text' => "XABAR YUBORISH"]],
            [['text' => "MAJBURIY OBUNA"], ['text' => "CHIQISH"]]
        ],
        'resize_keyboard' => true
    ];
    request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>ADMIN PANEL</b>\n\nBoshqaruv bo'limiga xush kelibsiz. Kerakli menyuni tanlang:", 'parse_mode' => 'HTML', 'reply_markup' => json_encode($kb)]);
}

function showSubscriptionHub($chat_id) {
    $active = db_getSetting('subscription_active');
    $status_text = $active ? "O'CHIRISH" : "YOQISH"; // Tugma
    $status_emoji = $active ? "YONIQ" : "O'CHIQ";
    
    $channels = db_getChannels();
    $list = "";
    if (empty($channels)) $list = "<i>(Kanallar yo'q)</i>";
    else foreach ($channels as $ch) $list .= "• " . $ch['channel_id'] . "\n";

    $txt = "<b>MAJBURIY OBUNA SOZLAMALARI</b>\n\n";
    $txt .= "Hozirgi holat: <b>$status_emoji</b>\n";
    $txt .= "Ulangan kanallar:\n$list\n\n";
    $txt .= "<i>Quyidagi tugmalar orqali boshqaring:</i>";

    $kb = [
        'keyboard' => [
            [['text' => "KANAL QO'SHISH"], ['text' => "KANAL O'CHIRISH"]],
            [['text' => $active ? "O'CHIRISH" : "YOQISH"], ['text' => "ORQAGA"]]
        ],
        'resize_keyboard' => true
    ];
    request('sendMessage', ['chat_id' => $chat_id, 'text' => $txt, 'parse_mode' => 'HTML', 'reply_markup' => json_encode($kb)]);
}

function showMainMenu($chat_id) {
    $main_keyboard = [
        'keyboard' => [
            [['text' => "RASM -> PDF"], ['text' => "FAYL -> ZIP"]], 
            [['text' => "MATN -> DOCX"], ['text' => "TUIT TITUL"]] 
        ],
        'resize_keyboard' => true
    ];
    
    $msg = "<b>Assalomu alaykum!</b>\n\n";
    $msg .= "Men quyidagi vazifalarni bajaruvchi botman:\n\n";
    $msg .= "<b>1. Rasm -> PDF:</b> Yuborilgan rasmlarni bitta PDF kitob shakliga keltirib beraman.\n";
    $msg .= "<b>2. Fayl -> ZIP:</b> Har qanday turdagi fayllarni bitta ZIP arxivga joylab beraman.\n";
    $msg .= "<b>3. Matn -> DOCX:</b> Yozgan matningizni Word (.docx) hujjati qilib qaytaraman.\n";
    $msg .= "<b>4. TUIT Titul:</b> Tayyor titul varaqasini yuklab beraman.\n\n";
    $msg .= "<i>Foydalanish uchun quyidagi tugmalardan birini tanlang:</i>";

    request('sendMessage', [
        'chat_id' => $chat_id, 
        'text' => $msg, 
        'parse_mode' => 'HTML', 
        'reply_markup' => json_encode($main_keyboard)
    ]);
}

function createAndSendPDF($chat_id, $dir, $filename, $caption = null) {
    if (!class_exists('FPDF')) {
         request('sendMessage', ['chat_id' => $chat_id, 'text' => "<b>Xato:</b> Tizimda PDF kutubxonasi topilmadi.", 'parse_mode' => 'HTML']);
         return;
    }
    $pdf = new FPDF();
    $images = array_merge((array)glob($dir . "*___*.jpg"), (array)glob($dir . "*___*.jpeg"), (array)glob($dir . "*___*.png"));
    usort($images, function($a, $b) { return filemtime($a) - filemtime($b); });

    if (empty($images)) return;

    foreach ($images as $img) {
        if (!getimagesize($img)) continue;
        $pdf->AddPage();
        list($w, $h) = getimagesize($img);
        $s = min(190/$w, 277/$h);
        $pdf->Image($img, 10+(190-$w*$s)/2, 10+(277-$h*$s)/2, $w*$s, $h*$s);
    }
    $out = $dir . "output.pdf";
    $pdf->Output('F', $out);
    if ($caption === null) $caption = "<b>Tayyor!</b> Faylingizni qabul qiling.\n\n<i>Nomini o'zgartirish uchun shu xabarga Reply qilib, yangi nom yozing.</i>";
    sendDocument($chat_id, $out, $filename . ".pdf", $caption);
}

function createAndSendZIP($chat_id, $dir, $filename, $caption = null) {
    $zip = new ZipArchive();
    $out = $dir . "output.zip";
    if ($zip->open($out, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
        $files = glob($dir . "*___*");
        usort($files, function($a, $b) { return filemtime($a) - filemtime($b); });
        foreach ($files as $file) {
            if (in_array(basename($file), ['.htaccess', 'output.zip', 'output.pdf'])) continue;
            $parts = explode("___", basename($file), 2);
            $zip->addFile($file, end($parts));
        }
        $zip->close();
        if ($caption === null) $caption = "<b>Tayyor!</b> Arxiv faylingizni qabul qiling.\n\n<i>Nomini o'zgartirish uchun shu xabarga Reply qilib, yangi nom yozing.</i>";
        sendDocument($chat_id, $out, $filename . ".zip", $caption);
    }
}

function downloadFile($url, $path) {
    $fp = fopen($path, 'w+');
    if (!$fp) return;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300);
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_exec($ch);
    curl_close($ch);
    fclose($fp);
}

function request($m, $d = []) {
    $ch = curl_init(API_URL . $m);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $d);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    $r = curl_exec($ch);
    curl_close($ch);
    return $r;
}

function sendDocument($cid, $path, $name, $cap = "") {
    $c = new CURLFile(realpath($path), null, $name);
    request('sendDocument', ['chat_id' => $cid, 'document' => $c, 'caption' => $cap, 'parse_mode' => 'HTML']);
}

function clearUserFiles($dir) {
    foreach (glob($dir . "*") as $f) {
        if (basename($f) != '.htaccess') if (is_file($f)) unlink($f);
    }
}

function countFiles($dir) {
    $c = 0;
    foreach (glob($dir . "*___*") as $f) $c++;
    return $c;
}

function cleanOldSessions() {
    $dirs = glob(UPLOAD_DIR . '*', GLOB_ONLYDIR);
    $now = time();
    foreach ($dirs as $dir) {
        if ($now - filemtime($dir) > FILE_LIFETIME) {
            $files = glob($dir . '/*');
            foreach ($files as $file) if (is_file($file)) unlink($file);
            @rmdir($dir);
        }
    }
}
?>