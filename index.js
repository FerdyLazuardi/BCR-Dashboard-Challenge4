const express = require('express');
const app = express();
const { cars } = require('./models')
const { Op, where } = require('sequelize');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');
const moment = require('moment');
const path = require('path');
const PORT = 3000;

// setting view engine
app.set('view engine', 'ejs')

// setting ejs layouts
app.use(expressLayouts)

app.use(express.urlencoded({ extended: true }));

// acces folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req,res) => {
  res.redirect('/car')
})

app.get('/car', async (req,res) => {
  const breadcrumb = [
    {name : 'Cars', url : '/car'},
    {name : 'List Car', url : '/car'},
  ]

  const carsUpdate = await cars.findAll({
    attributes : ['createdAt'],
  })
  const formattedDate = carsUpdate.map(car => moment(car.createdAt).format('DD MMMM YYYY, HH.mm'))
  console.log(formattedDate)

  if(req.query.filter){
    const Cars = await cars.findAll({
      where : {
        size : {
          [Op.substring] : req.query.filter
        }
      }
    });
    res.render('listCars', {
      layout : 'layouts/layout',
      title : 'List Car',
      breadcrumb,
      formattedDate,
      carsUpdate,
      Cars
    });
  } else if(req.query.search){
    const Cars = await cars.findAll({
      where : {
        name : {
          [Op.substring] : req.query.search
        }
      }
    })
    res.render('listCars', {
      layout : 'layouts/layout',
      title : 'List Car',
      breadcrumb,
      formattedDate,
      carsUpdate,
      Cars
    });
  }
    else {
    const Cars = await cars.findAll()
    
    res.render('listCars', {
        layout : 'layouts/layout',
        title : 'List Car',
        breadcrumb,
        formattedDate,
        carsUpdate,
        Cars
    });
   } 
})

app.get('/add', (req,res) => {
  const breadcrumb = [
    {name : 'Cars', url : '/car'},
    {name : 'List Car', url : '/car'},
    {name : 'Add New Car', url : '/add'},
  ]
    res.render('addCar', {
        layout : 'layouts/layout',
        title : 'Add New Cars',
        breadcrumb
    });
})

// add route to show image from multer
app.get('/image/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const car = await cars.findByPk(id);
    res.sendFile(path.join(__dirname, '/uploads/' + car.image));
  } catch (error) {
    console.error(error);
  }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage });

app.post('/car/add', upload.single('image'), async (req, res) => {
  const { name, price, size } = req.body;
  const filename = req.file.filename;
  try {
    const car = await cars.create({
      name: name,
      price: price,
      size: size,
      image: filename
    });
    res.redirect('/car');
  } catch (error) {
    console.error(error);
  }
});

app.get('/update/:id', async (req,res) => {
  const breadcrumb = [
    {name : 'Cars', url : '/car'},
    {name : 'List Car', url : '/car'},
    {name : 'Update Car Information', url : '/update/:id'},
  ]
  const carsDetail = await cars.findByPk(req.params.id)
  res.render('updateCar', {
    layout : 'layouts/layout',
    title : 'Update Car',
    carsDetail,
    breadcrumb
  });
})

app.post('/car/update/:id', upload.single('image'), async (req, res) => {
  const id = req.params.id
  const { name, price, size } = req.body;
  const filename = req.file.filename;
  try {
    const car = await cars.update({
      name: name,
      price: price,
      size: size,
      image: filename
    }, {
      where: {
        id
      }
    });
    res.redirect('/car');
  } catch (error) {
    console.error(error);
  }
});

app.post('/delete/:id', async (req,res) => {
  const id = req.params.id
  await cars.destroy({
    where:{
      id
    }
  })
  console.log(id)
  res.redirect('/car')
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
