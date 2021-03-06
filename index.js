require('dotenv').config()
let express = require('express')
let app = express()
const mongoose = require('mongoose')
var cookieSession = require('cookie-session')
const passport = require('passport')
require('./config/passport-setup')
const authRoutes = require('./routes/authRoutes')
const profileRoutes = require('./routes/profileRoutes')
const methodOverride = require('method-override')

const Medicine = require('./models/medicineModel')
const Therapy = require('./models/therapyModel')

const PORT = process.env.PORT || 5000

mongoose.connect(process.env.dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        console.log('Connected to my DB')
        app.listen(PORT, () => console.log(`http://localhost:${PORT}`))
    })
    .catch(err => console.log(err))

app.use(express.json())
app.use(express.urlencoded({ extended: true}))
app.use(methodOverride('_method'))
app.use(express.static('./public'))
app.set('view engine', 'ejs');   

var d = new Date();
    var date = d.getDate();
    var year = d.getFullYear();
    var month = d.getMonth();
    var monthArr = ["January", "February","March", "April", "May", "June", "July", "August", "September", "October", "November","December"];
    month = monthArr[month];

//Cookie-Session - setzt einen Cookie! 

app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 1000 * 60 * 60 *24 //Zeit in ms => das ist ein Tag
  }))


app.use(passport.initialize());
app.use(passport.session());


const authCheck = (req, res, next) => {
    // console.log(req);
    if (!req.user){
        res.redirect('/')
    } else {
        next()
    }
 
}

// Add 404 here...

// ROUTES AND REQUEST HANDLING GO HERE- CUSTOMISE AND UN-COMMENT

// Load the homepage
app.get('/', (req, res) => {
    res.render('index', {title: "home"})
})

app.get('/webpage', (req, res) => {
    res.render('webpage', {title: "webpage"})
})

app.get('/dashboard', (req, res) => {
    Therapy.find((err, data) => {
        if(err){
            res.json(err)
        }else{
            Medicine.find((err, response) => {
                if(err) {
                    res.json(err)
                }else{
                    res.render('dashboard', { date: `${date} ${month} ${year}` , data: req.user, title: "dashboard", Therapies: data, Medicines: response })
                }
            })
        }
    })
})


// Load the index-of-docs page. This is an index page that loops through the DB documents, e.g. blogposts, quotes
// app.get('/medikamente', authCheck, (req, res) => {
//     Medicine.find()
//         .then(data => {
//         // res.send(data) Use this to check the data arrives at '/'. Comment out the render method below first!
//         res.render('medikamente', { date: `${date} ${month} ${year}` , data: req.user, title: "medikamente", Medicines: data })
//         })
//         .catch(err => console.log(err))
// })


app.get('/medikamente', authCheck, (req, res) => {
    Medicine.find()
        .then(data => {
          Therapy.find()
          .then(therapydata => {
              res.render('medikamente', { date: `${date} ${month} ${year}` , data: req.user, title: "medikamente", 
        Medicines: data, Therapies: therapydata})
        })
    })
    .catch(err => console.log(err))
})



// ################# MEDICINE ROUTES #################
app.get('/neue-medikament', (req, res) => {
    res.render('neue-medikament', {data: req.user, title: "medikamente"})
})

// Creates a new DB entry from the frontend with POST
app.post('/neue-medikament', (req, res) => {
    
    const newMedicines = new Medicine(req.body)

    newMedicines.save()
        .then(result => {
            console.log(req.body)
            res.redirect('/medikamente')
        })
        .catch(err => console.log(err))
})

app.get('/single-med/:id', (req, res) => {
    Medicine.findById(req.params.id)
         .then(data => {
             res.render('single-med', { title: "medikamente", Medicine: data ,data: req.user})    // Note that you DON'T need to include /:id in this line
         })
         .catch(err => console.log(err))
 }) 

app.delete('/delete/:id', (req, res) => {
    Medicine.findByIdAndDelete(req.params.id)
        .then(result => res.redirect('/medikamente'))
        .catch(err => console.log(err))
})    


app.get('/update-medikament/:id', (req, res) => {
    Medicine.findById(req.params.id)
         .then(data => {
             res.render('update-medikament', { title: "medikamente", Medicine: data ,data: req.user})   // Note that you DON'T need to include /:id in this line
         })
         .catch(err => console.log(err))
 })

 app.post('/update-medikament/:id', (req, res) => {
    Medicine.findByIdAndUpdate(req.params.id, req.body)
        .then(result => res.redirect(`/single-med/${req.params.id}`))    // Note: With res.redirect(), you need to use template literals!!!
        .catch(err => console.log(err))
}) 

// Decrement inventory and update field in db
app.post('/medicine-update/:id/:inventory', (req, res) => {
    Medicine.findByIdAndUpdate(req.params.id, {inventory: req.params.inventory-=1}, {new: true}, (err, data) => {
        if(err){
            res.json(err)
        }
        res.redirect('/therapie')
    })
 }) 


// ################# AUTH ROUTES #################

app.get('/auth/google',
passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
passport.authenticate('google', { failureRedirect: '/' }),
function(req, res) {
  // Successful authentication, redirect home.
  res.redirect('/dashboard');
});

app.get('/auth/logout', (req, res) => {
    req.logout();
    res.redirect('/')
})

app.get('/auth/login', (req, res) => {
    res.render('index')
})


// app.use('/auth', authRoutes)

// PROFILE routes


app.get('/profile', authCheck, (req, res) => {
    
    // res.render('profile')
    console.log("Profile:", req);
    res.render('profile', {date: `${date} ${month} ${year}` ,title: "profile", data: req.user})
    res.end()
})

// app.use('/profile', profileRoutes)








// ################# THERAPY SECTION ################# //



app.get('/therapie', (req, res) => {

    Therapy.find((err, data) => {
        if(err){
            res.json(err)
        }else{
            Medicine.find((err, response) => {
                if(err) {
                    res.json(err)
                }else{
                    res.render('therapie', { date: `${date} ${month} ${year}` , data: req.user, title: "therapie", Therapies: data, Medicines: response })
                }
            })
        } 
    })

})


app.get('/neue-therapie', (req, res) => {

    Medicine.find()
    .then(data => {

    res.render('neue-therapie', {data: req.user, title: "Neue Therapie", Medicines: data })
    })
.catch(err => console.log(err))
})


 // Creates a new DB entry from the frontend with POST
app.post('/neue-therapie', (req, res) => {
    const newTherapy = new Therapy(req.body)

    newTherapy.save()
        .then(result => {
            res.redirect('/therapie')
        })
        .catch(err => console.log(err))
})

// single therapy page
app.get('/single-therapie/:id', (req, res) => {
    Therapy.findById(req.params.id)
         .then(data => {
             res.render('single-therapie', { title: "Meine Therapie", Therapy: data ,data: req.user})    // Note that you DON'T need to include /:id in this line
         })
         .catch(err => console.log(err))
 }) 

 // delete a therapy
 app.delete('/delete-therapy/:id', (req, res) => {
    Therapy.findByIdAndDelete(req.params.id)
        .then(result => res.redirect('/therapie'))
        .catch(err => console.log(err))
})    


app.get('/update-therapie/:id', (req, res) => {
    Therapy.findById(req.params.id)
         .then(data => {
            Medicine.find()
            .then(meddata => {
                res.render('update-therapie', { title: "Update Therapie", Therapy: data, Medicines: meddata ,data: req.user})  
            })
         })
         .catch(err => console.log(err))
 })

 app.patch('/update-therapie/:id', (req, res) => {
    Therapy.findByIdAndUpdate(req.params.id, req.body)
        .then(result => res.redirect(`/single-therapie/${req.params.id}`))   
        .catch(err => console.log(err))
})    