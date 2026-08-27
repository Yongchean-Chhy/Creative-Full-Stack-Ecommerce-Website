let express = require("express");
let app = express();
let cookie_parser = require("cookie-parser");
let fs = require("fs");
let path = require("path");
const { match } = require("assert");
const e = require("express");

const {addOrder, getOrders, getOrder, cancelOrder, updateOrderStatuses, updateOrder, getOrderHistory} = require("./data");
const { get } = require("http");

const PORT = 4131;

app.use(express.json({ limit: '1mb' }));
app.use(cookie_parser());
app.use(express.urlencoded({ extended: true }));

app.use("/resources", express.static(path.join(__dirname, "resources")));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "templates"));

const products = ["Power Nap Package", "Overnight Coverage", "Dream Customization"];

const prices = {
  "Power Nap Package": 1000.0,
  "Overnight Coverage": 30000.0,
  "Dream Customization": 100.0,
};

let orders = [
  {
    id: 0,
    status: "Delivered",
    cost: 1000.0,
    from_name: "Harry Potter",
    address: "Harry Potter\n1111 Dream Ave\nSnoozeville, CA 90210",
    product: "Power Nap Package",
    notes: "Additional 15 minutes",
  },
  {
    id: 1,
    status: "Shipped",
    cost: 30000.0,
    from_name: "Naruto Uzumaki",
    address: "Naruto Uzumaki\n2222 Konoha Rd\nDozington, TX 73301",
    product: "Overnight Coverage",
    notes: "15% discount",
  },
  {
    id: 2,
    status: "Placed",
    cost: 100.0,
    from_name: "Tanjiro Kamado",
    address: "Tanjiro Kamado\n333 Water Blvd.\nNap City, NY 10001",
    product: "Dream Customization",
    notes: "Flying with a horse",
  },
  {
    id: 3,
    status: "Shipped",
    cost: 30000.0,
    from_name: "Sasuke Uchiha",
    address: "Sasuke Uchiha\n4444 Fire Rd\nKonoha, TX 73333",
    product: "Overnight Coverage",
    notes: "",
  },
];

function escape_html(s){
    s = s.replace(/&/g, "&amp;");
    s = s.replace(/</g, "&lt;");
    s = s.replace(/>/g, "&gt;");
    s = s.replace(/"/g, "&quot;");
    s = s.replace(/'/g, "&#39;");
    return s;
}

function typeset_dollars(number){
    return `$${number.toFixed(2)}`;
}

function process_address(address){
    let matched = address.match(/\d+/);
    if (!matched){
        return address;
    }

    let idx = address.indexOf(matched[0]);
    let name = address.slice(0, idx-1);
    let rest = address.slice(idx + matched[0].length + 1).trim();
    let addr = rest.split(/\s+/);
    if (addr.length < 2){
        return `${name}\n${rest}`;
    }

    let addr2 = addr.slice(-2).join(" ");
    let addr1 = addr.slice(0, -2).join(" ");

    const trimmedAddr1 = addr1.endsWith(",") ? addr1.slice(0, -1) : addr1;
    return `${name}\n${trimmedAddr1}\n${addr2}`;
}

function add_new_order(order){
    const product_list = ["Power Nap Package", "Overnight Coverage", "Dream Customization"];
    const shipping_list = ["flat rate", "overnight shipping", "asap"];

    const error_list = [];
    let is_error = false;
    let is_long = false;

    if (!order.product || !product_list.includes(order.product)){
        is_error = true;
        error_list.push("Invalid product selected.");
    }
    else if (!order.shipping || !shipping_list.includes(order.shipping)){
        is_error = true;
        error_list.push("Invalid shipping option selected.");
    }
    else if (!Number.isInteger(order.quantity) || order.quantity <= 0){
        is_error = true;
        error_list.push("Quantity must be a positive integer.");
    }
    else if (!order.from_name || order.from_name.trim() === ""){
        is_error = true;
        error_list.push("Invalid sender name.");
    }
    else if (!order.address || order.address.trim() === ""){
        is_error = true;
        error_list.push("Invalid address.");
    }
    else if (order.address && order.address.length >= 1024){
        is_long = true;
    }

    if (is_error){
        return {status: "error", errors: error_list, code: 400};
    }
    if (is_long){
        return {status: "error", errors: error_list, code: 413};
    }

    const new_id = addOrder(order);
    return {status: "success", order_id: new_id, code: 200};
}

function cancel_order(order){
    return order.status === "Placed";
}

function update_shipping_info(order){
    return order.status === "Placed";
}


app.get(["/", "/about"], (req, res) => {
    res.render("about");
});
app.get("/tracking/:id", async (req, res) => {
    const id = Number(req.params.id);

    const order = await getOrder(id);

    if (!order){
        return res.status(404).render("404");
    }

    if (!Number.isInteger(id) || id < 0){
        return res.status(404).render("404");
    }


    order.costFormatted = typeset_dollars(Number(order.cost));
    const product_name = products[order.product_id -1];
    order.product = product_name;
    console.log("order", order);
    return res.render("tracking", { order });
});


app.get("/admin/orders", async (req, res) => {
    const buyer =  (req.query.query || "").toLowerCase();
    const status = (req.query.status || "all_statuses").toLowerCase();
    const filtered_orders = await getOrders(buyer, status);
    filtered_orders.forEach(order => {
        order.product = products[order.product_id - 1];
    });
    console.log("filtered_orders", filtered_orders);    
    res.render("render_orders", {
        buyer: escape_html(req.query.query || ""),
        status,
        filtered_orders,
        typeset_dollars
    });
});

app.get("/order", (req, res) => {
    let buyer_name = req.cookies.name || "";
    res.render("order", { buyer_name: escape_html(buyer_name) });
});

app.post("/api/order", async (req, res) => {
    let content_type = req.get("Content-Type") || "";
    if (!content_type.includes("application/json")){
        return res.status(400).json({ status: "error", errors: ["Expected application/json."] });
    }
    let data = req.body;
    if (!data || Object.keys(data).length === 0){
        console.log("here");
        return res.status(400).json({ status: "error", errors: ["Empty request body."] });
    }
    const required_fields = ["product", "quantity", "shipping", "from_name", "address"];
    for (const field of required_fields){
        if (!(field in data)){
            return res.status(400).json({ status: "error", errors: [`Missing field: ${field}.`] });
        }
    }

    const name = (data.from_name || "").trim();
    const address = (data.address || "").trim();
    if (name.length === 0 || address.length === 0){
        console.log("empty name or address");
        return res.status(400).json({ status: "error", errors: ["Name and address cannot be empty."] });
    }
    if (name.length > 64 || address.length > 1024){
        console.log("name or address too long");
        return res.status(413).json({ status: "error", errors: ["Name or address too long."] });
    }

    data.cost = prices[data.product] * Number(data.quantity);
    data.notes = data.notes || "";

    const new_id = await addOrder(data);
    
    if (new_id !== -1){
        const encoded_name = name.replace(/ /g, "%20");
        res.cookie("name", encoded_name, {path: "/", maxAge: 604800000});
        return res.status(201).json({status: "success", order_id: new_id });
    }else{
        return res.status(401).json({ status: "error", errors: ["Failed to create order."] });
    }
});

app.post("/api/update", async (req, res) => {
    let content_type = (req.get("Content-Type") || "").toLowerCase();
    if (!content_type.includes("application/json")){
        return res.status(400).json({status: "error", errors:["invalid content type"]});
    }

    let data = req.body;
    console.log("update data:", data);
    if(!data || !("order_id" in data)){
        return res.status(400).json({status: "error", errors:["missing order_id"]})
    }

    const id = Number(data.order_id);
    console.log("update order id:", id);
    if (!Number.isInteger(id)){
        return res.status(400).json({status: "error", errors:["invalid order_id"]});
    }

    const affectedRows = await updateOrder(id, data.shipping_option, data.new_addr);
    await updateOrderStatuses();
    

    if (affectedRows === 0){
        return res.status(400).json({status: "error", errors: ["cannot update shipping info for this order"]});
    }
    return res.status(200).json({status : "success", order_id: id});
});

app.delete("/api/cancel_order", async (req, res) => {
    const content_type = (req.get("Content-Type") || "").toLowerCase()
    if (!content_type.includes("application/json")){
        return res.status(400).json({});
    }

    const data = req.body;
    if(!data || !("order_id" in data)){
        return res.status(400).json({});
    }

    const id = Number(data.order_id);
    if (!Number.isInteger(id)){
        return res.status(400).json({});
    }

    const row = await cancelOrder(id);
    if (row === 0){
        return res.status(400).json({});
    }
    return res.status(200).json({});

});

app.get("/api/order/:id/history", async (req, res) => {
    const id = Number(req.params.id);
    console.log("history order id:", id);
    if (!Number.isInteger(id) || id < 0){
        return res.status(404).json({status: "error", errors: ["Order not found."]});
    }

    const row = await getOrderHistory(id);
    console.log("order history:", row);
    if (!row || row.length === 0){
        return res.status(404).json({status: "error", errors: ["Order not found."]});
    }
    else{
        return res.status(200).json({status: "success", history: row});
    }
});

app.use((req, res) => {
    res.status(404).render("404");
});

app.listen(PORT, () => {
    console.log(`Starting server http://localhost:${PORT}/`);
});


