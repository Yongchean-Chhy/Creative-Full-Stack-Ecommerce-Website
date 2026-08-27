function prefill(){
    const from_name = document.getElementById('from_name');
    const addr = document.getElementById('address');
    
    from_name.value = "Satoru Gojo";
    addr.value = "Satoru Gojo 123 Spirit Ave SE Bobo Lake, FL 99099";
}


document.addEventListener('DOMContentLoaded', () =>{
    const selected_product = document.getElementById('product');
    const cost = document.getElementById('product_cost');
    const order_date = document.getElementById('cur_date');
    const quantity_section = document.getElementById('quantity_section');
    const quantity = document.getElementById('quantity');
    const prefill_button = document.getElementById('prefill');
    const order_form = document.getElementById('order_form');

    const prices = {
        "Power Nap Package" : "1000.00",
        "Overnight Coverage": "30000.00",
        "Dream Customization": "100.00"
    };


    quantity_section.style.display = "none";

    prefill_button.addEventListener('click', prefill);

    selected_product.addEventListener('change', () => {
        const selected = selected_product.value;
        quantity_section.style.display = "block";
        quantity.value = 1;
        cost.textContent = `Total Cost: $${prices[selected]}`;
        console.log(selected);
        if (selected == "select a product") {
            cost.textContent = "Total Cost: Select a product and qunatity for cost information";
            quantity_section.style.display = "none";
            return;
        }
    });

    quantity_section.addEventListener('input', ()=>{
        const selected = selected_product.value;
        if (prices[selected] && quantity.value > 0){
            const total = prices[selected] * quantity.value;
            cost.textContent = `Total Cost: $${total}`;
        }
        else{
            cost.textContent = "Please Enter Correct Qunatity!";
        }
    });

    async function add_order(event){
        try{
            let data = {
                "product" : selected_product.value,
                "from_name" : document.getElementById('from_name').value,
                "quantity" : parseInt(quantity.value),
                "address" : document.getElementById('address').value,
                'shipping': document.querySelector('input[name="shipping_option"]:checked')?.value || "",
            };
            const response = await fetch('/api/order', {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            const result = await response.json();
            console.log("Order response:", result);
        
            let order_message_section = document.getElementById("order_message_section");
            let order_message = document.getElementById("order_message");
            let is_success = document.getElementById("is_success");

            order_message_section.style.display = "block";
            
            if (response.ok && result.status === "success"){
                is_success.textContent = "Order Placed Successfully!";
                order_message.textContent = `Order id: ${result.order_id}`;
                order_message_section.style.borderStyle = "solid";
                order_message_section.style.borderColor = "green";
                order_message_section.style.backgroundColor = "#c8ffd5ff";
            } else{
                is_success.textContent = "Order Fail!";
                order_message.textContent = "Errors:\n" + result.error;
                order_message_section.style.borderStyle = "solid";
                order_message_section.style.borderColor = "red";
                order_message_section.style.backgroundColor = "#ffb1b1ff";
            }
        }
        catch (error){
            console.error("Error submitting order:", error);
        }
    }

    order_form.addEventListener('submit', (e) => {
        e.preventDefault();
        add_order();
    });



    const cur_date = new Date();
    const month = cur_date.getMonth() + 1;
    const day = cur_date.getDate(); 
    const year = cur_date.getFullYear();
    const hours = cur_date.getHours();
    const minutes = cur_date.getMinutes().toString().padStart(2, '0');
    const second = cur_date.getSeconds().toString().padStart(2, '0'); 
    
    if(hours > 12){
        order_date.textContent = `${month}/${day}/${year} ${hours-12}:${minutes}:${second} PM`;
    } else if(hours === 12){
        order_date.textContent = `${month}/${day}/${year} ${hours}:${minutes}:${second} PM`;
    } else if(hours === 0){
        order_date.textContent = `${month}/${day}/${year} 12:${minutes}:${second} AM`;
    } else{
        order_date.textContent = `${month}/${day}/${year} ${hours}:${minutes}:${second} AM`;
    }
});