/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const discount = 1 - purchase.discount / 100;
  return purchase.sale_price * purchase.quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  if (index === 0) {
    return seller.profit * 0.15;
  } else if (index === 1 || index === 2) {
    return seller.profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    return seller.profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.customers) ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.customers.length === 0 ||
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records === 0
  ) {
    throw new Error("Некорректные входные данные");
  }
  // @TODO: Проверка наличия опций
  const { calculateRevenue, calculateBonus } = options; //возможно, нужна проверка через if
  if (!calculateRevenue || !calculateBonus) {
    throw new Error("переменные не определены");
  }
  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("переменные не являются функциями");
  }
  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));
  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((sell) => [sell.id, sell]),
  );
  const productIndex = Object.fromEntries(
    data.products.map((prod) => [prod.sku, prod]),
  );
  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id]; //нашли совпадение id продавца из sellerIndex и record
    seller.revenue = (seller.revenue || 0) + record.total_amount;
    seller.sales_count = (seller.sales_count || 0) + 1;
    record.items.forEach((item) => {
      const product = productIndex[item.sku]; //нашли совпадение sku
      const cost = product.purchase_price * item.quantity; //себестоимость
      const reven = calculateRevenue(item); // выручка со скидкой
      const profit = reven - cost;
      seller.profit = (seller.profit || 0) + profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });
  // @TODO: Сортировка продавцов по прибыли
  sellerStats
    .sort((a, b) => {
      if (a.profit > b.profit) {
        return 1;
      }
      if (a.profit < b.profit) {
        return -1;
      }
      if (a.profit === b.profit) {
        return 0;
      }
    })
    .reverse();
  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);
    let tryArr = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => {
        if (a.quantity > b.quantity) {
          return 1;
        }
        if (a.quantity < b.quantity) {
          return -1;
        }
        if (a.quantity === b.quantity) {
          return 0;
        }
      })
      .reverse()
      .slice(0, 10);
    seller.top_products = tryArr;
  });
  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    products_sold: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
