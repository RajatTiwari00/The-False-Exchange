// server.js

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const {users,orders} = require('./local_db.js');

app.use(bodyParser.json());




// Authentication middleware
function authenticateUser(req, res, next) {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  req.user = user;
  next();
}

app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // You can replace this with a database query to check user credentials
    const user = users.find((u) => u.username === username && u.password === password);
  
    if (user) {
      res.json({ message: 'Login successful' });
    } else {
      // Authentication failed
      res.status(401).json({ message: 'Login failed. Please check your credentials.' });
    }
  });

  // Define a function to generate a unique order ID
function generateOrderID() {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substr(2, 5); // Generate a random string
    return `${timestamp}-${randomString}`;
  }


// Endpoint to place an order
app.post('/place-order', authenticateUser, (req, res) => {
  const { user } = req;
  const { symbol, qty, price, type } = req.body;
  const orderID = generateOrderID();

  // Implement order placement logic here
  const order = { symbol, qty, price, type, user: user.username,id: orderID , executedQty: 0};
  orders.push(order);
  res.json({ message: 'Order placed successfully' });
});


app.put('/amend-order/:orderID', authenticateUser, (req, res) => {
    const { user } = req;
    const orderID = req.params.orderID;
    const { qty } = req.body;
  
    const order = orders.find((o) => o.id === orderID);
  
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
  
    if (order.user !== user.username) {
      return res.status(403).json({ message: 'Unauthorized to amend this order' });
    }
  
    if (order.executedQty > 0) {
      return res.status(400).json({ message: 'Cannot amend a partially executed order' });
    }
  
    // Update the order with the new quantity
    order.qty = qty;
    res.json({ message: 'Order amended successfully' });
  });
  

  // Endpoint to execute a trade
app.post('/execute-trade', (req, res) => {
    const { symbol, qty, price } = req.body;
  
    // Iterate through the orders and execute trades against them
    for (const order of orders) {
      if (order.symbol === symbol && order.qty > 0) {
        if (qty >= order.qty) {
          // The entire order is executed
          order.executedQty = order.qty;
          qty -= order.qty;
          order.qty = 0;
        } else {
          // Partial execution
          order.executedQty += qty;
          order.qty -= qty;
          qty = 0;
        }
  
        // You may want to add more trade information and handling here, e.g., updating the portfolio.
  
        // If qty becomes 0, no more trades need to be executed.
        if (qty === 0) break;
      }
    }
  
    // Return a response with details of the executed trade
    res.json({ message: 'Trade executed successfully' });
  });
  

  app.delete('/cancel-order/:orderID', authenticateUser, (req, res) => {
    const { user } = req;
    const orderID = req.params.orderID;
  
    const orderIndex = orders.findIndex((o) => o.id === orderID);
  
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
  
    const order = orders[orderIndex];
  
    if (order.user !== user.username) {
      return res.status(403).json({ message: 'Unauthorized to cancel this order' });
    }
  
    if (order.executedQty > 0) {
      return res.status(400).json({ message: 'Cannot cancel a partially executed order' });
    }
  
    // Remove the order from the orders array
    orders.splice(orderIndex, 1);
    res.json({ message: 'Order canceled successfully' });
  });
  
// Get a list of all orders
app.get('/orders', (req, res) => {
  // Return a list of all orders (executed and pending)
  res.json(orders);
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
