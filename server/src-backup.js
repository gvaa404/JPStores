const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Database = require('better-sqlite3');

const app = express();
const PORT = 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'jp-store-change-this-secret';
const ROOT = __dirname;
const UPLOADS = path.join(ROOT, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });
app.use(cors()); app.use(express.json()); app.use('/uploads', express.static(UPLOADS));

const db = new Database(path.join(ROOT, 'jp-store.db'));
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,phone TEXT DEFAULT '',address TEXT DEFAULT '',role TEXT NOT NULL DEFAULT 'customer',status TEXT NOT NULL DEFAULT 'active',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,description TEXT DEFAULT '',price REAL NOT NULL,discount REAL DEFAULT 0,stock INTEGER DEFAULT 0,category TEXT DEFAULT 'General',image TEXT DEFAULT '',status TEXT DEFAULT 'active',rating REAL DEFAULT 4.5,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,total REAL NOT NULL,address TEXT NOT NULL,payment_method TEXT NOT NULL,payment_status TEXT DEFAULT 'Pending',status TEXT DEFAULT 'Ordered',created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER NOT NULL,product_id INTEGER NOT NULL,quantity INTEGER NOT NULL,price REAL NOT NULL,FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE IF NOT EXISTS wishlist(user_id INTEGER NOT NULL,product_id INTEGER NOT NULL,PRIMARY KEY(user_id,product_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),store_name TEXT DEFAULT 'JP Store',email TEXT DEFAULT 'hello@jpstore.com',phone TEXT DEFAULT '+91 98765 43210',shipping REAL DEFAULT 49,tax REAL DEFAULT 0,return_policy TEXT DEFAULT '7-day return policy',privacy_policy TEXT DEFAULT 'Your privacy matters.',terms TEXT DEFAULT 'Standard terms apply.');
`);
if(!db.prepare('SELECT 1 FROM users WHERE email=?').get('admin@jpstore.com')) db.prepare('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)').run('JP Store Admin','admin@jpstore.com',bcrypt.hashSync('admin123',10),'admin');
if(!db.prepare('SELECT 1 FROM settings WHERE id=1').get()) db.prepare('INSERT INTO settings(id) VALUES(1)').run();
if(db.prepare('SELECT COUNT(*) c FROM products').get().c===0){ const p=db.prepare('INSERT INTO products(name,description,price,discount,stock,category,image) VALUES(?,?,?,?,?,?,?)');
[['Elegant Floral Journal','Premium hardbound journal with floral detailing',499,10,25,'Stationery',''],['Pastel Gift Box','Curated fancy gift box for special occasions',899,15,12,'Gifts',''],['Rose Gold Pen Set','Smooth writing pen set with premium finish',299,5,40,'Pens',''],['Pretty Sticker Pack','Aesthetic decorative sticker collection',149,0,100,'Stickers','']].forEach(x=>p.run(...x)); }

const upload = multer({ storage: multer.diskStorage({destination: UPLOADS, filename:(req,file,cb)=>cb(null,Date.now()+'-'+file.originalname.replace(/[^a-zA-Z0-9.]/g,'_'))}), limits:{fileSize:5*1024*1024} });
function token(user){ return jwt.sign({id:user.id,role:user.role},JWT_SECRET,{expiresIn:'7d'}); }
function auth(req,res,next){ try{ const d=jwt.verify((req.headers.authorization||'').replace('Bearer ','') ,JWT_SECRET); req.user=db.prepare('SELECT * FROM users WHERE id=?').get(d.id); if(!req.user||req.user.status==='blocked') return res.status(401).json({error:'Unauthorized'}); next(); }catch(e){res.status(401).json({error:'Unauthorized'});} }
function admin(req,res,next){if(req.user.role!=='admin')return res.status(403).json({error:'Admin only'});next();}

app.post('/api/auth/register',(req,res)=>{try{const {name,email,password,phone='',address=''}=req.body;if(!name||!email||!password)return res.status(400).json({error:'Name, email and password are required'});const info=db.prepare('INSERT INTO users(name,email,password,phone,address) VALUES(?,?,?,?,?)').run(name,email,bcrypt.hashSync(password,10),phone,address);const u=db.prepare('SELECT id,name,email,phone,address,role FROM users WHERE id=?').get(info.lastInsertRowid);res.json({token:token(u),user:u});}catch(e){res.status(400).json({error:'Email already exists'});}});
app.post('/api/auth/login',(req,res)=>{const u=db.prepare('SELECT * FROM users WHERE email=?').get(req.body.email);if(!u||!bcrypt.compareSync(req.body.password||'',u.password)||u.status==='blocked')return res.status(401).json({error:'Invalid credentials'});res.json({token:token(u),user:{id:u.id,name:u.name,email:u.email,phone:u.phone,address:u.address,role:u.role}});});
app.get('/api/me',auth,(req,res)=>res.json({id:req.user.id,name:req.user.name,email:req.user.email,phone:req.user.phone,address:req.user.address,role:req.user.role}));
app.put('/api/me',auth,(req,res)=>{const {name,phone,address}=req.body;db.prepare('UPDATE users SET name=?,phone=?,address=? WHERE id=?').run(name,phone,address,req.user.id);res.json({ok:true});});

app.get('/api/products',(req,res)=>{let sql='SELECT * FROM products WHERE status="active"';const args=[];if(req.query.category){sql+=' AND category=?';args.push(req.query.category)}if(req.query.search){sql+=' AND name LIKE ?';args.push('%'+req.query.search+'%')}sql+=' ORDER BY id DESC';res.json(db.prepare(sql).all(...args));});
app.get('/api/products/:id',(req,res)=>{const p=db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);if(!p)return res.status(404).json({error:'Not found'});res.json(p);});
app.post('/api/products',auth,admin,upload.single('image'),(req,res)=>{const {name,description='',price,discount=0,stock=0,category='General',status='active'}=req.body;const image=req.file?'/uploads/'+req.file.filename:'';const x=db.prepare('INSERT INTO products(name,description,price,discount,stock,category,image,status) VALUES(?,?,?,?,?,?,?,?)').run(name,description,Number(price),Number(discount),Number(stock),category,image,status);res.json({id:x.lastInsertRowid});});
app.put('/api/products/:id',auth,admin,upload.single('image'),(req,res)=>{const old=db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);const {name,description,price,discount,stock,category,status}=req.body;const image=req.file?'/uploads/'+req.file.filename:old.image;db.prepare('UPDATE products SET name=?,description=?,price=?,discount=?,stock=?,category=?,status=?,image=? WHERE id=?').run(name,description,Number(price),Number(discount),Number(stock),category,status,image,req.params.id);res.json({ok:true});});
app.delete('/api/products/:id',auth,admin,(req,res)=>{db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);res.json({ok:true});});

app.post('/api/orders',auth,(req,res)=>{const {items,address,payment_method}=req.body;if(!items?.length)return res.status(400).json({error:'Cart is empty'});const tx=db.transaction(()=>{let total=0;const rows=[];for(const i of items){const p=db.prepare('SELECT * FROM products WHERE id=?').get(i.product_id);if(!p||p.stock<i.quantity)throw new Error('Product unavailable');const price=p.price*(1-p.discount/100);total+=price*i.quantity;rows.push({p,qty:i.quantity,price});}const o=db.prepare('INSERT INTO orders(user_id,total,address,payment_method,payment_status) VALUES(?,?,?,?,?)').run(req.user.id,total,address,payment_method,'Paid');for(const r of rows){db.prepare('INSERT INTO order_items(order_id,product_id,quantity,price) VALUES(?,?,?,?)').run(o.lastInsertRowid,r.p.id,r.qty,r.price);db.prepare('UPDATE products SET stock=stock-? WHERE id=?').run(r.qty,r.p.id);}return o.lastInsertRowid;});try{res.json({orderId:tx()})}catch(e){res.status(400).json({error:e.message})}});
app.get('/api/orders',auth,(req,res)=>{const where=req.user.role==='admin'?'':'WHERE o.user_id=?';const rows=db.prepare(`SELECT o.*,u.name customer_name,u.email FROM orders o JOIN users u ON u.id=o.user_id ${where} ORDER BY o.id DESC`).all(...(req.user.role==='admin'?[]:[req.user.id]));for(const o of rows)o.items=db.prepare('SELECT oi.*,p.name,p.image FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?').all(o.id);res.json(rows);});
app.put('/api/orders/:id/status',auth,admin,(req,res)=>{db.prepare('UPDATE orders SET status=? WHERE id=?').run(req.body.status,req.params.id);res.json({ok:true});});
app.put('/api/orders/:id/cancel',auth,(req,res)=>{const o=db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);if(!o|| (req.user.role!=='admin'&&o.user_id!==req.user.id))return res.status(404).json({error:'Not found'});db.prepare('UPDATE orders SET status="Cancelled",payment_status="Refund pending" WHERE id=?').run(o.id);res.json({ok:true});});

app.get('/api/wishlist',auth,(req,res)=>res.json(db.prepare('SELECT p.* FROM wishlist w JOIN products p ON p.id=w.product_id WHERE w.user_id=?').all(req.user.id)));
app.post('/api/wishlist/:id',auth,(req,res)=>{const exists=db.prepare('SELECT 1 FROM wishlist WHERE user_id=? AND product_id=?').get(req.user.id,req.params.id);if(exists)db.prepare('DELETE FROM wishlist WHERE user_id=? AND product_id=?').run(req.user.id,req.params.id);else db.prepare('INSERT OR IGNORE INTO wishlist VALUES(?,?)').run(req.user.id,req.params.id);res.json({ok:true,added:!exists});});

app.get('/api/admin/dashboard',auth,admin,(req,res)=>{const q=(s)=>db.prepare(s).get();res.json({orders:q('SELECT COUNT(*) c FROM orders').c,sales:q('SELECT COALESCE(SUM(total),0) c FROM orders WHERE payment_status="Paid"').c,products:q('SELECT COUNT(*) c FROM products').c,customers:q('SELECT COUNT(*) c FROM users WHERE role="customer"').c,pending:q('SELECT COUNT(*) c FROM orders WHERE status IN ("Ordered","Processing")').c,lowStock:q('SELECT COUNT(*) c FROM products WHERE stock<=5').c,cancelled:q('SELECT COUNT(*) c FROM orders WHERE status IN ("Cancelled","Returned")').c,recent:q('SELECT o.*,u.name customer_name FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT 8').all()});});
app.get('/api/admin/customers',auth,admin,(req,res)=>res.json(db.prepare(`SELECT u.id,u.name,u.email,u.phone,u.status,u.created_at,COUNT(o.id) orders,COALESCE(SUM(o.total),0) spending FROM users u LEFT JOIN orders o ON o.user_id=u.id WHERE u.role='customer' GROUP BY u.id ORDER BY u.id DESC`).all()));
app.put('/api/admin/customers/:id/status',auth,admin,(req,res)=>{db.prepare('UPDATE users SET status=? WHERE id=?').run(req.body.status,req.params.id);res.json({ok:true});});
app.get('/api/admin/payments',auth,admin,(req,res)=>res.json(db.prepare('SELECT o.id,o.total,o.payment_method,o.payment_status,o.created_at,u.name,u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC').all()));
app.get('/api/settings',(req,res)=>res.json(db.prepare('SELECT * FROM settings WHERE id=1').get()));
app.put('/api/settings',auth,admin,(req,res)=>{const s=req.body;db.prepare('UPDATE settings SET store_name=?,email=?,phone=?,shipping=?,tax=?,return_policy=?,privacy_policy=?,terms=? WHERE id=1').run(s.store_name,s.email,s.phone,Number(s.shipping),Number(s.tax),s.return_policy,s.privacy_policy,s.terms);res.json({ok:true});});
app.get('/api/categories',(req,res)=>res.json(db.prepare('SELECT DISTINCT category FROM products WHERE status="active" ORDER BY category').all().map(x=>x.category)));
app.get('/api/reviews/:id',(req,res)=>res.json([]));
app.listen(PORT,()=>console.log(`JP Store API running on http://localhost:${PORT}`));
