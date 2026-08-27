create table Orders(
    id int not null primary key auto_increment,
    from_name varchar(64) not null,
    cost decimal(10,2) not null,
    status varchar(32) not null,
    address varchar(1024) not null,
    quantity int not null,
    notes text,
    shipping varchar(64) not null,
    product_id int not null,
    order_date datetime not null,

    foreign key (product_id) references Products(id)
);

create table Products(
    id int not null primary key auto_increment,
    name varchar(128) not null,
    description text,
    price decimal(10,2) not null
);

insert into Products (name, price) values
('Power Nap Package', 1000.00),
('Overnight Coverage', 30000.00),
('Dream Customization', 100.00);

insert into Orders (from_name, cost, status, address, quantity, notes, shipping, product_id, order_date) values
('Harry Potter', 1000.00, 'Delivered', 'Harry Potter 1111 Dream Ave Snoozeville, CA 90210', 1, 'Additional 15 minutes', 'flat rate', 1, '2025-11-11 11:11:11'),
('Tanjiro Kamado', 100.00, 'Placed', 'Tanjiro Kamado 333 Water Blvd. Nap City, NY 10001', 1, 'Flying with a horse', 'overnight shipping', 3, '2025-11-12 12:12:12'),
('Sasuke Uchiha', 30000.00, 'Shipped', 'Sasuke Uchiha 4444 Fire Rd Konoha, TX 73333', 1, '', 'overnight shipping', 2, '2025-10-10 10:10:10'),
('Naruto Uzumaki', 30000.00, 'Shipped', 'Naruto Uzumaki 2222 Konoha Rd Dozington, TX 73301', 1, '15% discount', 'ASAP', 2, '2025-10-11 11:11:13');

create table OrderHistories(
    id int not null primary key auto_increment,
    order_id int not null,
    shipping varchar(32) not null,
    update_time datetime not null,

    foreign key (order_id) references Orders(id)
);

insert into OrderHistories (order_id, shipping, update_time) values
(1, 'flat rate', '2025-11-11 11:11:11'),
(2, 'overnight shipping', '2025-11-12 12:12:12'),
(3, 'overnight shipping', '2025-10-10 10:10:10'),
(4, 'ASAP', '2025-10-11 11:11:13');

alter table OrderHistories add address varchar(1024) not null;
