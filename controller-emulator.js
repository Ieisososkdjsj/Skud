// controller-emulator.js
const axios = require('axios');
const readline = require('readline');

// Конфиг
const SERVER_URL = 'http://localhost:3000/api/check';

// Интерфейс для ввода UID с клавиатуры
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Эмулятор контроллера запущен. Введите UID карты:');

rl.on('line', async (uid) => {
  try {
    // Отправляем UID на сервер
    const response = await axios.post(SERVER_URL, { uid: uid.trim() });

    if (response.data.status === 'Разрешено') {
      console.log(`Доступ разрешён для ${response.data.fio}`);
      console.log('>>> Турникет открыт');
    } else {
      console.log('Доступ запрещён!');
      console.log('>>> Турникет закрыт');
    }
  } catch (err) {
    console.error('Ошибка при запросе к серверу:', err.message);
  }

  console.log('\nВведите следующий UID карты:');
});
