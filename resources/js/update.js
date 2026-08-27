document.addEventListener('DOMContentLoaded', () =>{
    const cancel_button = document.getElementById('cancel_order');
    const update_section = document.getElementById('update_detail');
    const update_button = document.getElementById('update_shipping');
    const timer = document.getElementById("countdown");
    const status = document.getElementById('status');
    const history = document.getElementById('order_history');


    let t = null;
    let time = 300;
    if(timer){
        function setTimer(){
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            if (time > 0) {
                time--;
            } else {
                status.textContent = "Shipped";
                clearInterval(t);

            }
        }
        t = setInterval(setTimer, 1000);
        setTimer();
    }
    
    if(update_section){
        update_section.style.display = "none";
    }
    
    async function update_history(id) {
        const response = await fetch(`/api/order/${id}/history`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        if (response.ok){
            console.log("reach1");
            let history_detail = document.getElementById('history_detail');
            history_detail.innerHTML = "";
            const table_title = document.createElement('h3');
            table_title.textContent = "Order History";
            history_detail.appendChild(table_title);

            const table = document.createElement('table');
            const tableHead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const headers = ["ID", "Order ID", "Shipping", "Address", "Update Time"];
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow);
            table.appendChild(tableHead);

            const tableBody = document.createElement('tbody');
            console.log("history result:", result.history);
            result.history.forEach(history => {
                const row = document.createElement('tr');
                const keys = ["id", "order_id", "shipping_option", "address", "update_time"];
                keys.forEach(key => {
                    const cell = document.createElement('td');
                    cell.textContent = history[key] || '';
                    row.appendChild(cell);
                });
                tableBody.appendChild(row);

            });
            table.appendChild(tableBody);
            history_detail.appendChild(table);
            history_detail.style.display = "block";

        }
        else{
            console.error("Failed to fetch order history");
        }
    }

    if (history){
        const id = document.getElementById('order_id').textContent;
        history.addEventListener('click', () => {
            update_history(id);
        });
    }
    //let history_detail = document.getElementById('history_detail');
    

    async function cancelOrder() {
        const statusElem = document.getElementById('status');
        let orderIdElem = document.getElementById('order_id');
        let errorMessageElem = document.getElementById('error_message');
        let descriptionElem = document.getElementById('description');
        let timeSection = document.getElementById('time_sect');

        let orderId = parseInt(orderIdElem.value || orderIdElem.textContent);
    
        let response = await fetch('/api/cancel_order', {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ order_id: orderId })
        });
        

        if (response.status === 200) {
            statusElem.textContent = "Cancelled";
            cancel_button.disabled = true;
            update_button.disabled = true;
            update_section.style.display = "none";
            timeSection.style.display = "none";
            clearInterval(t);

            
            errorMessageElem.textContent = "Order cancelled successfully!";
            descriptionElem.textContent = "Your order has been cancelled and will not be processed.";
        }
        else if (response.status === 400) {
            if (errorMessageElem){
                errorMessageElem.textContent = "The order ID was invalid.";
                descriptionElem.textContent = "Please check the order ID and try again.";
            }
        } 
        else {
            if (errorMessageElem){
                errorMessageElem.textContent = "Unexpected server error.";
                descriptionElem.textContent = "Please try again later.";
            }
        }
    };

    if (cancel_button){
        cancel_button.addEventListener('click', cancelOrder);
    }


    if (update_button){
        update_button.addEventListener("click", () =>{
            update_section.style.display = "block";
        });
    }
  
    const update_form = document.getElementById('update_form')
    
    if(update_form){
        update_form.addEventListener("submit", async(e) =>{
            e.preventDefault();

            try{
                const orderIdElem = document.getElementById('order_id');
                const newAddr = document.getElementById("new_addr");
                const selected_option = document.querySelector('input[name="shipping_option"]:checked');
                const orderId = parseInt(orderIdElem.value || orderIdElem.textContent);
                const shippingOption = selected_option ? selected_option.value : '';
                let errorMessageElem = document.getElementById('error_message');
                let descriptionElem = document.getElementById('description');

                const data = {
                    order_id: orderId
                }
                if (newAddr && newAddr.value.trim()) {
                data.new_addr = newAddr.value.trim();
                }   
            
                if (shippingOption) {
                    data.shipping_option = shippingOption;
                }

                const response = await fetch('/api/update', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                console.log('result', result);
                if (response.ok && result.status === "success"){
                    if(errorMessageElem){
                        errorMessageElem.textContent = "Your order is updated!"
                    }
                    if(descriptionElem){
                        descriptionElem.textContent = "The order is updated and will prepared to ship"
                    }
                } else{
                    if(errorMessageElem){
                        errorMessageElem.textContent = "Update Fail!"
                    }
                    if(descriptionElem){
                        descriptionElem.textContent = "The order cannot be update. Pleace check your detail information."
                    }
                }
            }
            catch (error){
                console.error("Error updating order:", error);
            }
        })
    }
});