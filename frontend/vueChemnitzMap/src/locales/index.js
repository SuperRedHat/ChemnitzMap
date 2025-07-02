import { createI18n } from 'vue-i18n';
import en from './en.json';
import de from './de.json';
import zh from './zh.json';

// 获取浏览器语言
function getBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage;
  
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('zh')) return 'zh';
  return 'en'; // 默认英语
}

// 获取保存的语言或浏览器语言
function getInitialLanguage() {
  const saved = localStorage.getItem('language');
  if (saved && ['en', 'de', 'zh'].includes(saved)) {
    return saved;
  }
  return getBrowserLanguage();
}

const i18n = createI18n({
  legacy: false, // 添加这一行！使用 Composition API 模式
  locale: getInitialLanguage(),
  fallbackLocale: 'en',
  messages: {
    en,
    de,
    zh
  }
});

// 保存语言选择
export function setLanguage(lang) {
  i18n.global.locale.value = lang; // 注意这里也要修改为 .value
  localStorage.setItem('language', lang);
  document.querySelector('html').setAttribute('lang', lang);
}

export default i18n;