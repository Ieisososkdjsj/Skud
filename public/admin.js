// ===== Вход администратора =====
async function adminLogin() {
  const login = document.getElementById("adminLoginInput").value.trim();
  const password = document.getElementById("adminPassword").value.trim();
  if (!login || !password) {
    alert("Введите логин и пароль");
    return;
  }

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    const data = await res.json();

    if (data.status === "OK") {
      document.getElementById("loginCard").style.display = "none";
      document.getElementById("registrationCard").style.display = "block";
      document.getElementById("logoutBtn").style.display = "inline-block";
      loadLogs();
    } else {
      alert("Неверный логин или пароль");
    }
  } catch (err) {
    console.error(err);
    alert("Ошибка сервера");
  }
}

// ===== Выход администратора =====
async function adminLogout() {
  try {
    await fetch("/api/admin/logout", { method: "POST" });
    document.getElementById("loginCard").style.display = "block";
    document.getElementById("registrationCard").style.display = "none";
    document.getElementById("logoutBtn").style.display = "none";
  } catch (err) {
    console.error(err);
    alert("Ошибка выхода");
  }
}

// ===== Добавление пользователя =====
async function addUser() {
  const fio = document.getElementById("fio").value.trim();
  const uid = document.getElementById("uid").value.trim();
  const department = document.getElementById("department").value;

  if (!fio || !uid || !department) {
    alert("Заполните все поля");
    return;
  }

  try {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fio, uid, department }),
    });
    const data = await res.json();
    alert(data.message || data.error);
  } catch (err) {
    console.error(err);
    alert("Ошибка при добавлении пользователя");
  }
}

// ===== Загрузка логов =====
async function loadLogs() {
  try {
    const res = await fetch("/api/logs");
    if (!res.ok) throw new Error(`Ошибка сервера ${res.status}`);
    const logs = await res.json();
    const table = document.getElementById("logsTable");
    table.innerHTML = `
        <tr>
            <th>ФИО</th>
            <th>UID</th>
            <th>Статус</th>
            <th>Точка доступа</th>
            <th>Время</th>
        </tr>
    `;

    logs.forEach((log) => {
      table.innerHTML += `
        <tr>
            <td>${log["ФИО"] || "Неизвестно"}</td>
            <td>${log["UID"]}</td>
            <td>${log.status}</td>
            <td>${log.access_point}</td>
            <td>${new Date(log.timestamp).toLocaleString()}</td>
        </tr>
        `;
    });
  } catch (err) {
    console.error(err);
    alert("Не удалось загрузить логи. Проверьте сервер.");
  }
}
