const express = require('express');
const app = express();
const { cars } = require('./models')
const { Op, where } = require('sequelize');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');
const moment = require('moment');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const path = require('path');
const PORT = 3000;

// setting view engine
app.set('view engine', 'ejs')

// setting ejs layouts
app.use(expressLayouts)

app.use(express.urlencoded({ extended: true }));

// acces folder
app.use(express.static(path.join(__dirname, 'public')));

// configuration flash
app.use(cookieParser('secret'));
app.use(session({
    cookie : { maxAge: 6000},
    secret : 'secret',
    resave : false,
    saveUninitialized : false,
 })
);
app.use(flash());

app.get('/', (req,res) => {
  res.redirect('/car')
})

// get car
app.get('/car', async (req,res) => {

  // create breadcrumb for name link
  const breadcrumb = [
    {name : 'Cars', url : '/car'},
    {name : 'List Car', url : '/car'},
  ]

  let currentFilter = req.query.filter;

  // validation by query (filter size)
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
      Cars,
      currentFilter,
      msg: req.flash('msg'),
      del: req.flash('del')
    });
  } 

    // validation for query search
    else if(req.query.search){
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
      Cars,
      currentFilter,
      msg: req.flash('msg'),
      del: req.flash('del')
    });
  }

  // show find all without query
    else {
    const Cars = await cars.findAll()
    res.render('listCars', {
        layout : 'layouts/layout',
        title : 'List Car',
        breadcrumb,
        Cars,
        currentFilter,
        msg: req.flash('msg'),
        del: req.flash('del')
    });
   } 
})

// link to page add
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

// configuration multer save to local disk public directory
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage });

// post a new car with image
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

    // send flash message succes
    req.flash('msg','Data Berhasil Disimpan')
    res.redirect('/car');
  } catch (error) {
    console.error(error);
  }
});

// link to page update by id
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

// update data cars byy id
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
    req.flash('msg','Data Berhasil Diupdate')
    res.redirect('/car');
  } catch (error) {
    console.error(error);
  }
});

// delete cars by id
app.post('/delete/:id', async (req,res) => {
  const id = req.params.id
  await cars.destroy({
    where:{
      id
    }
  })

  req.flash('del','Data Berhasil Dihapus') // flash message delete
  res.redirect('/car')
})

// run server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
