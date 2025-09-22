exports.handler = async (event, context) => {
  // Проверяем метод запроса
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  // Получаем переменные окружения
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  // Проверяем наличие токена и chat ID
  if (!BOT_TOKEN || !CHAT_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Telegram credentials' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  try {
    // Парсим данные из запроса
    const data = JSON.parse(event.body);
    
    // Функция для преобразования типа топлива
    const formatFuelType = (type) => {
      const types = {
        'summer': 'ДТ летнее',
        'winter': 'ДТ зимнее',
        'arctic': 'ДТ арктическое',
        'inter': 'ДТ межсезонное'
      };
      return types[type] || type;
    };

    // Формируем красивое сообщение
    const message = `🚛 <b>НОВАЯ ЗАЯВКА НА ДОСТАВКУ ДИЗТОПЛИВА</b>

📋 <b>Тип топлива:</b> ${formatFuelType(data.fuel_type || data['fuel-type'])}
⛽ <b>Объем:</b> ${Number(data.volume).toLocaleString()} л
📍 <b>Адрес:</b> ${data.address}
📅 <b>Дата:</b> ${new Date(data.date).toLocaleDateString('ru-RU')}
🕐 <b>Время:</b> ${data.time}
🏢 <b>Компания:</b> ${data.company}
📞 <b>Телефон:</b> ${data.phone}${data.comment ? `\n💭 <b>Комментарий:</b> ${data.comment}` : ''}

⏰ <i>Заявка получена: ${new Date().toLocaleString('ru-RU')}</i>`;

    // Отправляем сообщение в Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      }),
    });

    const telegramData = await telegramResponse.json();

    if (telegramData.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Заявка успешно отправлена!' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } else {
      console.error('Telegram API Error:', telegramData);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: 'Ошибка отправки в Telegram' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Внутренняя ошибка сервера' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};
