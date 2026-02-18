require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const pool = require("./db");

const app = express();

const allowedDepartments = ["ГВК", "ОГТ", "Склад", "Офис"];
const fioRegex = /^[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+$/;

app.use(express.json());

//Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

app.use(express.static("public"));

// Middleware проверки администратора
function checkAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.status(403).json({ error: "Not authorized" });
  }
  next();
}

// Логин администратора
app.post("/api/admin/login", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ status: "ERROR" });
  }

  try {
    const result = await pool.query("SELECT * FROM admins WHERE login = $1", [
      login,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ status: "DENIED" });
    }

    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(401).json({ status: "DENIED" });
    }

    req.session.adminId = admin.id;

    res.json({ status: "OK" });
  } catch (err) {
    console.error("Ошибка логина:", err);
    res.status(500).json({ status: "ERROR" });
  }
});

// Выход администратора
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ status: "LOGOUT" });
  });
});

//Регистрация пользователя
app.post("/api/users", checkAdmin, async (req, res) => {
  const { fio, uid, department } = req.body;

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
      SELECT * FROM users WHERE "UID" = $1 AND is_active = true`,
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
    const allowed = access_point === "КПП" || user["Отдел"] === access_point;

    await pool.query(
      `
      INSERT INTO logs (user_id, "UID", access_point, status)
       VALUES ($1, $2, $3, $4)`,
      [user.id, uid, access_point, allowed ? "ALLOWED" : "DENIED"],
    );

    return res.json({
      status: allowed ? "ALLOWED" : "DENIED",
      fio: allowed ? user["ФИО"] : undefined,
    });
  } catch (err) {
    console.error("CHECK ERROR:", err);
    return res.status(500).json({ status: "ERROR" });
  }
});

//Логи
app.get("/api/logs", checkAdmin, async (req, res) => {
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
