// Routes
const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const dashboardRoutes = require('./routes/dashboard');
const billingRoutes = require('./routes/billingRoutes');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');

app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

app.use('/', authRoutes);
app.use('/data', dataRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/billing', billingRoutes);
app.use('/admin', adminRoutes);
app.use('/student', studentRoutes);