// Утилитарные функции

// Показ уведомления
export function showToast(message, isSuccess = true) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = isSuccess ? 'var(--accent)' : 'var(--warning)';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Дебаунс для оптимизации
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Генератор случайных шуток
export function getRandomJoke() {
    const jokes = [
        "Данные загружены! Надеюсь, администраторы знали, что делали...",
        "Готово! Ищем косяки в работе админов...",
        "Таблица создана! Приготовьтесь к увлекательному разбору полетов!",
        "Обработка завершена. Найдено потенциальных жертв для разбора: "
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
}