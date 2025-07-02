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
  i18n.global.locale = lang;
  localStorage.setItem('language', lang);
  document.querySelector('html').setAttribute('lang', lang);
}

export default i18n;