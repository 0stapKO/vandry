export const formatCount = (value: number, one: string, few: string, many: string) => {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return `${value} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${value} ${few}`;
  return `${value} ${many}`;
};

export const formatDuration = (seconds: number) => {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hoursText = formatCount(hours, 'година', 'години', 'годин');
    if (minutes > 0) {
      const minutesText = formatCount(minutes, 'хвилина', 'хвилини', 'хвилин');
      return `${hoursText} ${minutesText}`;
    }
    return hoursText;
  }
  return formatCount(totalMinutes, 'хвилина', 'хвилини', 'хвилин');
};

export const formatDurationCompact = (seconds: number) => {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours} год ${minutes} хв` : `${hours} год`;
  }
  return `${totalMinutes} хв`;
};

export const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} м`;
  return `${(meters / 1000).toFixed(1)} км`;
};

const categoryTranslations: Record<string, string> = {
  'restaurant': 'Ресторан', 'cafe': 'Кафе', 'coffee': 'Кав\'ярня',
  'bar': 'Бар', 'pub': 'Паб', 'museum': 'Музей', 'gallery': 'Галерея',
  'park': 'Парк', 'garden': 'Сад', 'hotel': 'Готель', 'hostel': 'Хостел',
  'monument': 'Пам\'ятник', 'historic': 'Історична пам\'ятка', 'castle': 'Замок',
  'church': 'Церква', 'place of worship': 'Храм', 'attraction': 'Цікавинка',
  'tourism': 'Туризм', 'theatre': 'Театр', 'cinema': 'Кінотеатр',
  'shop': 'Магазин', 'supermarket': 'Супермаркет', 'bakery': 'Пекарня',
  'bus': 'Зупинка', 'transit': 'Транспорт'
};

export const getTranslatedCategory = (englishCategory: string) => {
  if (!englishCategory) return "Пам'ятка";
  const lower = englishCategory.toLowerCase();
  if (categoryTranslations[lower]) return categoryTranslations[lower];
  for (const [eng, ukr] of Object.entries(categoryTranslations)) {
    if (lower.includes(eng)) return ukr;
  }
  return "Локація";
};