const express = require("express");
const path = require("path");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const allowedDepartments = ["ГВК", "ОГТ", "Склад", "Офис"];
const fioRegex = /^[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+$/;

//ДОБАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
app.post("/api/users", async (req, res) => {
  const { fio, uid, department, adminPassword } = req.body;

  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Неверный пароль администратора" });
  }

  if (!fioRegex.test(fio)) {
    return res.status(400).json({
      error: "ФИО должно быть полностью на русском и состоять из 3 слов",
    });
  }

  if (!allowedDepartments.includes(department)) {
    return res.status(400).json({ error: "Недопустимый отдел" });
  }

  try {
    await pool.query(
      `
      INSERT INTO users ("ФИО", "UID", "Отдел")
       VALUES ($1, $2, $3)`,
      [fio.trim(), uid, department],
    );

    res.json({ message: "Пользователь добавлен" });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "UID уже зарегистрирован" });
    }
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

//Проверка доступа
app.post("/api/check", async (req, res) => {
  const { uid, access_point } = req.body;

  if (!uid || !access_point) {
    return res.status(400).json({ status: "ERROR" });
  }

  try {
    const result = await pool.query(
      `
      SELECT * FROM users
      WHERE "UID" = $1 AND is_active = true`,
      [uid],
    );

    if (result.rows.length === 0) {
      await pool.query(
        `
        INSERT INTO logs ("UID", access_point, status)
        VALUES ($1, $2, 'DENIED')`,
        [uid, access_point],
      );

      return res.json({ status: "DENIED" });
    }

    const user = result.rows[0];

    //Логика доступа
    const allowed = access_point === "КПП" || user["Отдел"] === access_point;
    await pool.query(`
          INSERT INTO logs (user_id, "UID", access_point, status) VALUES ($1, $2, $3, $4),
      [user.id, uid, access_point, allowed ? 'ALLOWED' : 'DENIED']`);

    res.json({ status: allowed ? "ALLOWED" : "DENIED", fio: user["ФИО"] });

    //Разрешено
    await pool.query(
      `
      INSERT INTO logs (user_id, "UID", access_point, status)
      VALUES ($1, $2, $3, 'ALLOWED')
    `,
      [user.id, uid, access_point],
    );

    res.json({
      status: "ALLOWED",
      fio: user["ФИО"],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "ERROR" });
  }
});

//Логи
app.get("/api/logs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u."ФИО", l."UID", l.status, l.access_point, l.timestamp
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.timestamp DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка при получении логов:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});
//Старт сервера
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on http://localhost:3000");
});
