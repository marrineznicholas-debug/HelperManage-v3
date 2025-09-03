import { database, ref, set, onValue, push } from './firebase-config.js';
import { showToast, debounce, getRandomJoke } from './utils.js';

// Глобальные переменные для хранения данных
let mainData = [];
let errorsData = [];
let stats = {
    notesAdded: 0,
    rowsDeleted: 0,
    errorsCount: 0,
    totalProcessed: 0
};

let keywords = [];

// Регулярное выражение для парсинга данных
const regex = /Администратор (\w+) ответил на репорт (\w+): Вопрос:(.*?) Ответ:(.*)/;

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация приложения
    initApp();
});

function initApp() {
    // Элементы DOM
    const inputData = document.getElementById('inputData');
    const parseBtn = document.getElementById('parseBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const copyErrorsBtn = document.getElementById('copyErrorsBtn');
    const mainTableBody = document.getElementById('mainTableBody');
    const errorsTableBody = document.getElementById('errorsTableBody');
    const emptyMain = document.getElementById('emptyMain');
    const emptyErrors = document.getElementById('emptyErrors');
    
    // Элементы модальных окон
    const statsBtn = document.getElementById('statsBtn');
    const keywordsBtn = document.getElementById('keywordsBtn');
    const statsOverlay = document.getElementById('statsOverlay');
    const keywordsOverlay = document.getElementById('keywordsOverlay');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const modalNotesCount = document.getElementById('modalNotesCount');
    const modalDeletedCount = document.getElementById('modalDeletedCount');
    const modalErrorsCount = document.getElementById('modalErrorsCount');
    const modalTotalCount = document.getElementById('modalTotalCount');
    const newKeywordInput = document.getElementById('newKeyword');
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    const keywordList = document.getElementById('keywordList');
    const deleteByKeywordsBtn = document.getElementById('deleteByKeywordsBtn');
    
    // Загрузка данных из Firebase
    loadFirebaseData();
    
    // Обработчики событий
    setupEventListeners();
    
    function setupEventListeners() {
        // Основные кнопки
        parseBtn.addEventListener('click', handleParse);
        clearAllBtn.addEventListener('click', handleClearAll);
        copyErrorsBtn.addEventListener('click', handleCopyErrors);
        
        // Модальные окна
        statsBtn.addEventListener('click', () => statsOverlay.classList.add('active'));
        keywordsBtn.addEventListener('click', () => keywordsOverlay.classList.add('active'));
        
        closeModalButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                statsOverlay.classList.remove('active');
                keywordsOverlay.classList.remove('active');
            });
        });
        
        [statsOverlay, keywordsOverlay].forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.remove('active');
            });
        });
        
        // Ключевые слова
        addKeywordBtn.addEventListener('click', handleAddKeyword);
        deleteByKeywordsBtn.addEventListener('click', handleDeleteByKeywords);
        
        // Оптимизированные обработчики ввода
        inputData.addEventListener('input', debounce(() => {
            saveToFirebase('inputText', inputData.value);
        }, 1000));
    }
    
    function handleParse() {
        const text = inputData.value.trim();
        if (!text) {
            showToast('Введите данные для обработки!', false);
            return;
        }
        
        const lines = text.split('\n');
        const newData = [];
        
        lines.forEach(line => {
            const match = line.match(regex);
            if (match) {
                newData.push({
                    admin: match[1],
                    reporter: match[2],
                    question: match[3].trim(),
                    answer: match[4].trim(),
                    note: ''
                });
            }
        });
        
        if (newData.length === 0) {
            showToast('Не удалось распознать данные. Проверьте формат.', false);
            return;
        }
        
        // Добавляем новые данные
        mainData = [...mainData, ...newData];
        stats.totalProcessed += newData.length;
        
        renderMainTable();
        saveAllData();
        updateEmptyStates();
        updateStats();
        
        showToast(getRandomJoke() + newData.length);
    }
    
    function handleClearAll() {
        if (confirm("Точно удалить все данные? Это действие нельзя отменить!")) {
            clearAllData();
            updateEmptyStates();
            showToast("Таблицы очищены! Чистый лист - новые возможности! 😊");
        }
    }
    
    function handleCopyErrors() {
        if (errorsData.length === 0) {
            showToast("Нет данных для копирования!", false);
            return;
        }
        
        const textarea = document.createElement('textarea');
        textarea.style.position = 'fixed';
        textarea.style.opacity = 0;
        
        let text = "Репорт\tПримечание\n";
        errorsData.forEach(error => {
            text += `${error.report}\t${error.note}\n`;
        });
        
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            showToast(successful ? "Данные скопированы!" : "Не удалось скопировать", successful);
        } catch (err) {
            showToast("Ошибка при копировании: " + err, false);
        }
        
        document.body.removeChild(textarea);
    }
    
    function handleAddKeyword() {
        const keyword = newKeywordInput.value.trim();
        if (keyword && !keywords.includes(keyword)) {
            keywords.push(keyword);
            saveToFirebase('keywords', keywords);
            renderKeywords();
            newKeywordInput.value = '';
            showToast('Ключевое слово добавлено');
        } else if (keywords.includes(keyword)) {
            showToast('Это слово уже есть в списке', false);
        }
    }
    
    function handleDeleteByKeywords() {
        if (keywords.length === 0) {
            showToast('Нет ключевых слов для удаления', false);
            return;
        }
        
        let deletedCount = 0;
        const remainingData = [];
        
        for (const item of mainData) {
            let shouldDelete = false;
            
            for (const keyword of keywords) {
                if (
                    item.question.toLowerCase().includes(keyword.toLowerCase()) ||
                    item.answer.toLowerCase().includes(keyword.toLowerCase())
                ) {
                    shouldDelete = true;
                    break;
                }
            }
            
            if (shouldDelete) {
                deletedCount++;
            } else {
                remainingData.push(item);
            }
        }
        
        mainData = remainingData;
        stats.rowsDeleted += deletedCount;
        stats.totalProcessed += deletedCount;
        
        saveAllData();
        updateStats();
        renderMainTable();
        updateEmptyStates();
        
        showToast(`Удалено ${deletedCount} строк по ключевым словам`);
    }
    
    // Firebase функции
    function loadFirebaseData() {
        // Загрузка данных из Firebase в реальном времени
        onValue(ref(database, 'inputText'), (snapshot) => {
            const data = snapshot.val();
            if (data) inputData.value = data;
        });
        
        onValue(ref(database, 'mainData'), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                mainData = data;
                renderMainTable();
            }
        });
        
        onValue(ref(database, 'errorsData'), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                errorsData = data;
                renderErrorsTable();
            }
        });
        
        onValue(ref(database, 'stats'), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                stats = data;
                updateStats();
            }
        });
        
        onValue(ref(database, 'keywords'), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                keywords = data;
                renderKeywords();
            }
        });
        
        updateEmptyStates();
    }
    
    function saveToFirebase(path, data) {
        set(ref(database, path), data).catch((error) => {
            console.error("Ошибка сохранения в Firebase:", error);
            showToast("Ошибка синхронизации", false);
        });
    }
    
    function saveAllData() {
        saveToFirebase('mainData', mainData);
        saveToFirebase('errorsData', errorsData);
        saveToFirebase('stats', stats);
        saveToFirebase('inputText', inputData.value);
    }
    
    // Остальные функции (renderMainTable, renderErrorsTable, renderKeywords, etc.)
    // остаются такими же, как в оригинальном коде, но с использованием Firebase
}