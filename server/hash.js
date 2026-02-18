const bcrypt = require('bcrypt');

async function createHash() {
  try {
    const password = 'dmTAt';
    const hash = await bcrypt.hash(password, 10);
    console.log('Хеш пароля:', hash);
  } catch (err) {
    console.error('Ошибка при создании хеша:', err);
  }
}

createHash();