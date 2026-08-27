const mysql = require("mysql2/promise");

var connPool = mysql.createPool({
  connectionLimit: 5, // it's a shared resource, let's not go nuts.
  host: "cse-mysql-classes-02.cse.umn.edu", // this will work
  user: "C4131F25U15",
  database: "C4131F25U15",
  password: "275", // we really shouldn't be saving this here long-term -- and I probably shouldn't be sharing it with you...
});

async function addOrder(data) {
  let conn = await connPool.getConnection();
  const get_prod_id_sql = "select id from Products where name = ?";
  const [prod_id] = await conn.execute(get_prod_id_sql, [data.product]);

  if (prod_id.length === 0) {
    return -1;
  }

  const sql = `insert into Orders
    (from_name, cost, status, address, quantity, notes, shipping, product_id, order_date) 
    values (?, ?, 'Placed', ?, ?, ?, ?, ?, NOW())`;

  const params = [
    data.from_name,
    data.cost,
    data.address,
    data.quantity,
    data.notes,
    data.shipping,
    prod_id[0].id,
  ];
  const [result] = await conn.execute(sql, params);
  const new_id = result.insertId;

  const order_history_sql = `insert into OrderHistories (order_id, shipping, update_time, address)
    values (?, ?, NOW(), ?)`;

  const [history_result] = await conn.execute(order_history_sql, [new_id, data.shipping, data.address]);
  conn.release();
  return new_id;
}

async function getOrders(query, status) {
  const conn = await connPool.getConnection();
  let sql = `select * from Orders where 1=1`;
  const params = [];
  if (query) {
    sql += ` and from_name like ?`;
    params.push(`%${query.toLowerCase()}%`);
  }
  if (status && status !== "all_statuses") {
    sql += ` and status like ?`;
    params.push(status.toLowerCase());
  }

  const [results] = await conn.execute(sql, params);
  conn.release();
  return results;
}

async function updateOrder(id, shipping, address) {
  const conn = await connPool.getConnection();
  if (!shipping && !address) {
    conn.release();
    return 0;
  }
  if (!shipping) {
    shipping = (await getOrder(id)).shipping;
  }
  if (!address) {
    address = (await getOrder(id)).address;
  }
  const sql = `update Orders set shipping = ?, address = ? where id = ? and status = 'Placed'`;
  const params = [shipping, address, id];
  const [result] = await conn.execute(sql, params);

  const historysql = `
    insert into OrderHistories (order_id, shipping, update_time, address)
    select id, shipping, NOW(), address from Orders where id = ?`;

  await conn.execute(historysql, [id]);
  conn.release();
  return result.affectedRows;
}


async function cancelOrder(id) {
  const conn = await connPool.getConnection();
  const sql = `update Orders set status = 'Cancelled' where id = ? and status = 'Placed'`;
  const params = [id];
  const [result] = await conn.execute(sql, params);
  conn.release();
  return result.affectedRows;
}

async function getOrder(orderId) {
  const sql = `select * from Orders where id = ?`;
  const params = [orderId];
  const [results] = await connPool.execute(sql, params);
  return results[0];
}

async function updateOrderStatuses() {
  const conn = await connPool.getConnection();
  const sql = `
    update Orders
    set status = 'Shipped'
    where status = 'Placed'
    and order_date <= NOW() - INTERVAL 5 MINUTE`;

  const [result] = await conn.execute(sql);

  conn.release();
  return result.affectedRows;
}

async function getOrderHistory(id) {
  const sql = `
    select * from OrderHistories
    where order_id = ? 
    order by update_time desc
    limit 5`;
  const [row] = await connPool.execute(sql, [id]);
  return row;
}

module.exports = {
  getOrder,
  addOrder,
  getOrders,
  updateOrderStatuses,
  updateOrder,
  cancelOrder,
  getOrderHistory,
};
