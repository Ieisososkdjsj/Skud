const input = document.getElementById("uidInput");
const result = document.getElementById("result");

input.focus();

input.addEventListener("keydown", async function (e) {
  if (e.key !== "Enter") return;

  const uid = this.value.trim();
  const access_point = "КПП"; // всегда КПП

  if (!uid) return;

  try {
    const res = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ uid, access_point }),
    });
    const data = await res.json();

    switch (data.status) {
      case "ALLOWED":
        result.innerText = "ДОСТУП РАЗРЕШЕН: " + (data.fio || "");
        result.style.color = "green";
        break;

      case "DENIED":
        result.innerText = "ДОСТУП ЗАПРЕЩЕН";
        result.style.color = "red";
        break;

      case "ERROR":
        result.innerText = "ОШИБКА СЕРВЕРА";
        result.style.color = "orange";
        break;

      default:
        result.innerText = "НЕИЗВЕСТНЫЙ ОТВЕТ";
        result.style.color = "gray";
    }
  } catch (err) {
    result.innerText = "НЕТ СОЕДИНЕНИЯ С СЕРВЕРОМ";
    result.style.color = "orange";
  }

  this.value = "";
  input.focus();
});
