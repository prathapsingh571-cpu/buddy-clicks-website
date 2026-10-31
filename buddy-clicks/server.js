const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeThisAdminPassword!";
const DATA = path.join(__dirname, "data.json");
const PUBLIC = path.join(__dirname, "public");

const seed = {
  products: [
    {id:"p1",name:"Classic White Polo",category:"Polo T-Shirts",price:699,oldPrice:899,tag:"Bestseller",description:"A clean everyday polo made for comfort, casual days and team identity.",sizes:["S","M","L","XL","XXL"],color:"White",image:"https://images.unsplash.com/photo-1625910513413-5fc?auto=format&fit=crop&w=900&q=85"},
    {id:"p2",name:"Midnight Blue Polo",category:"Polo T-Shirts",price:749,oldPrice:949,tag:"Popular",description:"A timeless navy polo with a smart, versatile fit.",sizes:["S","M","L","XL","XXL"],color:"Navy Blue",image:"https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=900&q=85"},
    {id:"p3",name:"Custom Team Tee",category:"Custom Prints",price:799,oldPrice:1099,tag:"Customisable",description:"Make your team stand out with custom text, artwork or logo printing.",sizes:["S","M","L","XL","XXL"],color:"White",image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85"},
    {id:"p4",name:"Friendship Edition Tee",category:"Graphic T-Shirts",price:649,oldPrice:849,tag:"New",description:"A relaxed graphic tee made for your favourite people and memories.",sizes:["S","M","L","XL","XXL"],color:"Navy Blue",image:"https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85"},
    {id:"p5",name:"Everyday Essential Tee",category:"Graphic T-Shirts",price:499,oldPrice:699,tag:"Value pick",description:"Soft-feel everyday T-shirt that pairs with almost anything.",sizes:["S","M","L","XL","XXL"],color:"White",image:"https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85"},
    {id:"p6",name:"Crew Neck Classic",category:"Custom Prints",price:599,oldPrice:799,tag:"Trending",description:"A classic crew-neck base ready for your custom design.",sizes:["S","M","L","XL","XXL"],color:"Blue",image:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85"}
  ],
  orders: []
};

function readDB() {
  if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, JSON.stringify(seed, null, 2));
  try { return JSON.parse(fs.readFileSync(DATA, "utf8")); } catch { return structuredClone(seed); }
}
function writeDB(db) { fs.writeFileSync(DATA, JSON.stringify(db, null, 2)); }
function send(res, status, data, type="application/json") {
  res.writeHead(status, {"Content-Type": type, "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"Content-Type, x-admin-password", "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS"});
  res.end(type === "application/json" ? JSON.stringify(data) : data);
}
function body(req) {
  return new Promise((resolve,reject)=>{let s="";req.on("data",c=>s+=c);req.on("end",()=>{try{resolve(s?JSON.parse(s):{});}catch(e){reject(e);}});});
}
function admin(req,res) {
  if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) { send(res,401,{error:"Unauthorised. Check admin password."}); return false; }
  return true;
}
const server = http.createServer(async (req,res) => {
  if(req.method==="OPTIONS") return send(res,204,{});
  const u = new URL(req.url, `http://${req.headers.host}`);
  const db = readDB();
  try {
    if(u.pathname==="/api/products" && req.method==="GET") return send(res,200,db.products);
    if(u.pathname.startsWith("/api/admin/")) {
      if(!admin(req,res)) return;
      if(u.pathname==="/api/admin/products" && req.method==="POST") {
        const p=await body(req); if(!p.name || !Number.isFinite(Number(p.price))) return send(res,400,{error:"Product name and valid price are required."});
        const item={id:crypto.randomUUID(),name:String(p.name),category:String(p.category||"T-Shirts"),price:Number(p.price),oldPrice:Number(p.oldPrice||p.price),tag:String(p.tag||""),description:String(p.description||""),sizes:Array.isArray(p.sizes)?p.sizes:["S","M","L","XL"],color:String(p.color||"Blue"),image:String(p.image||"")};
        db.products.unshift(item);writeDB(db);return send(res,201,item);
      }
      if(u.pathname.startsWith("/api/admin/products/") && req.method==="DELETE") {
        const id=u.pathname.split("/").pop();db.products=db.products.filter(p=>p.id!==id);writeDB(db);return send(res,200,{ok:true});
      }
      if(u.pathname==="/api/admin/orders" && req.method==="GET") return send(res,200,db.orders);
      if(u.pathname.startsWith("/api/admin/orders/") && req.method==="PUT") {
        const id=u.pathname.split("/").pop(), b=await body(req), order=db.orders.find(o=>o.id===id);
        if(!order)return send(res,404,{error:"Order not found"});order.status=String(b.status||order.status);writeDB(db);return send(res,200,order);
      }
      return send(res,404,{error:"Admin route not found"});
    }
    if(u.pathname==="/api/orders" && req.method==="POST") {
      const b=await body(req);
      if(!b.customer?.name || !b.customer?.phone || !b.customer?.address || !Array.isArray(b.items) || !b.items.length) return send(res,400,{error:"Please provide contact, delivery address and cart items."});
      const items=b.items.map(i=>{const p=db.products.find(x=>x.id===i.id);if(!p)throw new Error("A selected product is no longer available.");return {id:p.id,name:p.name,price:p.price,size:String(i.size||"M"),quantity:Math.max(1,Math.min(20,Number(i.quantity)||1))};});
      const total=items.reduce((n,i)=>n+i.price*i.quantity,0);
      const order={id:"BC"+Date.now().toString().slice(-8),createdAt:new Date().toISOString(),customer:{name:String(b.customer.name),phone:String(b.customer.phone),email:String(b.customer.email||""),address:String(b.customer.address)},items,total,payment:String(b.payment||"Cash on Delivery"),status:"Order Placed"};
      db.orders.unshift(order);writeDB(db);return send(res,201,{id:order.id,total,status:order.status});
    }
    if(u.pathname.startsWith("/api/track/") && req.method==="GET") {
      const id=u.pathname.split("/").pop(), order=db.orders.find(o=>o.id.toLowerCase()===id.toLowerCase());
      return order?send(res,200,{id:order.id,status:order.status,createdAt:order.createdAt,items:order.items,total:order.total}):send(res,404,{error:"No order found. Check your order ID."});
    }
    if(u.pathname.startsWith("/api/")) return send(res,404,{error:"API route not found"});
    let pathname=decodeURIComponent(u.pathname); if(pathname==="/")pathname="/index.html";
    const full=path.join(PUBLIC,pathname);
    if(!full.startsWith(PUBLIC))return send(res,403,"Forbidden","text/plain");
    fs.readFile(full,(err,data)=>{if(err)return send(res,404,"Not found","text/plain");const ext=path.extname(full);const types={".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};send(res,200,data,types[ext]||"application/octet-stream");});
  } catch(e) { send(res,400,{error:e.message||"Something went wrong"}); }
});
server.listen(PORT,()=>console.log(`Buddy Clicks running at http://localhost:${PORT}`));