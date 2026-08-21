/**
 * EGYETLEN igazságforrás a termékadatokhoz (ár, ÁFA, kép, kiszerelés).
 * Ezt a fájlt a /api/catalog végpont szolgálja ki a webshop.html-nek, ÉS
 * ugyanez alapján validálja/számolja az árakat a create-checkout-session.js
 * is. Árváltozásnál MOSTANTÓL CSAK EZT a fájlt kell módosítanod.
 *
 * FONTOS: a tisztított zöldségeknél (a tisztított fokhagyma KIVÉTELÉVEL)
 * minQty:5, qtyStep:1 van beállítva - vagyis minimum 5 kg-tól rendelhetők,
 * onnantól 1 kg-onként emelhető a mennyiség. Ez a szabály KÖZVETLENÜL itt,
 * a katalógusban van rögzítve (nem a kliensben), hogy a
 * create-checkout-session.js is automatikusan ugyanezt kényszerítse ki.
 *
 * FONTOS (tészták): a "teszta" kategória árai (990 Ft/kg) és képútvonalai
 * (teszta/<név>.jpg) egyelőre PLACEHOLDER értékek - nincs még hozzájuk
 * valódi ár vagy fénykép megadva. Kérjük, cseréld le ezeket a tényleges
 * árakra, és töltsd fel a megfelelő képeket a "teszta/" mappába a
 * webshop.html mellett (vagy módosítsd az img útvonalakat, ha máshova
 * kerülnek a fájlok).
 */

const CATALOG = [
  {
    id: "zoldseg", label: "Zöldségek",
    groups: [
      { label: "Burgonyafélék", items: [
        { id:"burgonya",       name:"Burgonya",        img:"zold/burgonya.jpg",       unit:"kg", price:250 },
        { id:"sargaburgonya",  name:"Burgonya sárga",  img:"zold/sargaburgonya.jpg",  unit:"kg", price:360 },
        { id:"parazs",         name:"Burgonya parázs", img:"zold/parazs.jpg",         unit:"kg", price:180 },
        { id:"edesburg",       name:"Édes burgonya",   img:"zold/edesburg.jpg",       unit:"kg", price:620 }
      ]},
      { label: "Hagymafélék", items: [
        { id:"voroshagyma",    name:"Vöröshagyma",     img:"zold/voroshagyma.jpg",    unit:"kg", price:250 },
        { id:"foki",           name:"Fokhagyma",       img:"zold/foki.jpg",           unit:"kg", price:1790 },
        { id:"lilali",         name:"Lilahagyma",      img:"zold/lilali.jpg",         unit:"kg", price:270 },
        { id:"pore",           name:"Póréhagyma",      img:"zold/pore.jpg",           unit:"db", price:350 },
        { id:"feherhagyma",    name:"Fehérhagyma",     img:"zold/feherhagyma.jpg",    unit:"kg", price:890 },
        { id:"ujhagyma",       name:"Újhagyma",        img:"zold/ujhagyma.jpg",       unit:"csomó", price:320 },
        { id:"salotta",       name:"Salottahagyma",        img:"zold/salott.jpg",       unit:"kg", price:990 },
      ]},
      { label: "Káposztafélék", items: [
        { id:"Broccoli",       name:"Brokkoli",              img:"zold/Broccoli.jpg",      unit:"kg", price:1600 },
        { id:"fejeskapi",      name:"Fejes káposzta",        img:"zold/fejeskapi.jpg",     unit:"kg", price:220 },
        { id:"karal",          name:"Karalábé",              img:"zold/karal.jpg",         unit:"db", price:280 },
        { id:"karfiol",        name:"Karfiol",               img:"zold/karfiol.jpg",       unit:"kg", price:500 },
        { id:"kelkapi",        name:"Kelkáposzta",           img:"zold/kelkapi.jpg",       unit:"kg", price:490 },
        { id:"lilakapi",       name:"Lila káposzta",         img:"zold/lilakapi.jpg",      unit:"kg", price:220 },
        { id:"Pak-choi",       name:"Pak-choi",              img:"zold/Pak-choi.jpg",      unit:"kg", price:1400 },
        { id:"kinaikel",       name:"Kínai kel",              img:"zold/kinaikel.jpg",      unit:"kg", price:1400 },
      ]},
      { label: "Paprikafélek", items: [
        { id:"tv",             name:"Tv paprika",                    img:"zold/tv.jpg",       unit:"kg", price:650 },
        { id:"tricolor",       name:"Kaliforniai paprika (Tricolor)",img:"zold/tricolor.jpg", unit:"kg", price:1995 },
        { id:"kalif",          name:"Kaliforniai paprika (Piros)",   img:"zold/kalif.jpg",    unit:"kg", price:1290 },
        { id:"kapia",          name:"Kápia",                         img:"zold/kapia.jpg",    unit:"kg", price:1290 }
      ]},
      { label: "Erős paprikák", items: [
        { id:"eros",           name:"Zöld erős paprika",           img:"zold/eros.jpg",     unit:"db", price:160 },
        { id:"chili",          name:"Cayenne chili",                 img:"zold/chili.jpg",    unit:"kg", price:4500 },
        { id:"jalapeno",          name:"Jalapeno",                 img:"zold/jala.jpg",    unit:"kg", price:3700 },
        { id:"habanero",          name:"Habanero",                 img:"zold/haba.jpg",    unit:"kg", price:6300 },
      ]},
      { label: "Paradicsomfélék", items: [
        { id:"pari",           name:"Paradicsom",       img:"zold/pari.jpg",   unit:"kg", price:450 },
        { id:"koktel",         name:"Koktélparadicsom", img:"zold/koktel.jpg", unit:"kg", price:1550 },
        { id:"sargakoktel",    name:"Koktélparadicsom sárga", img:"zold/sargakoktel.jpg", unit:"kg", price:2990 }
      ]},
      { label: "Gyökérzöldségek", items: [
        { id:"repa",           name:"Sárgarépa",          img:"zold/repa.jpg",          unit:"kg", price:320 },
        { id:"gyoker",         name:"Petrezselyem Gyökér",img:"zold/gyoker.jpg",        unit:"kg", price:990 },
        { id:"feketegyoker",         name:"Fekete Gyökér",img:"zold/feketegyok.jpg",        unit:"kg", price:2590 },
        { id:"cekla-z",        name:"Cékla",              img:"zold/cekla.jpg",         unit:"kg", price:350 },
        { id:"zellerzold",     name:"Zellergumó zölddel",        img:"zold/zellerzold.jpg",    unit:"db", price:390 },
        { id:"zellergumo",     name:"Zellergumó",         img:"zold/zellergumo.jpg",    unit:"kg", price:295 },
        { id:"angolzeller",    name:"Angol zeller",       img:"zold/angolzeller.jpg",   unit:"csomag", price:570 },
        { id:"jegcsap",        name:"Jégcsapretek",       img:"zold/jegcsap.jpg",       unit:"kg", price:590 }
      ]},
      { label: "Tökfélék", items: [
        { id:"kigyo",          name:"Kígyó uborka", img:"zold/kigyo.jpg",     unit:"kg", price:590 },
        { id:"furtosubi",      name:"Kovászolni való uborka",img:"zold/furtosubi.jpg", unit:"kg", price:690 },
        { id:"cukkini",        name:"Cukkini",img:"zold/cukkini.jpg", unit:"kg", price:550 },
        { id:"sutotok",        name:"Sütőtök",img:"zold/sutotok.jpg", unit:"kg", price:590 },
        { id:"fozotok",        name:"Főzőtök",img:"zold/fozo.jpg", unit:"kg", price:490 },
        { id:"patisszon",        name:"Patiszon csillagtök",img:"zold/patisszon.jpg", unit:"kg", price:400 },
        { id:"padlizsan",      name:"Padlizsán",img:"zold/padlizsan.jpg", unit:"kg", price:800 }
      ]},
      { label: "Gombák", items: [
        { id:"gomba",          name:"Gomba Csiperke 500g", img:"zold/gomba.jpg",        unit:"csomag", price:690 },
        { id:"barnagomba",     name:"Barna Csiperke 500g", img:"zold/barnacsiperke.jpg", unit:"csomag", price:690 },
        { id:"laska",          name:"Laskagomba 500g",     img:"zold/laska.jpg",        unit:"csomag", price:899 },
        { id:"shimei",         name:"Shimei fehér 150 g",   img:"zold/shimeji.jpg",      unit:"csomag", price:520 },
        { id:"shimeibarna",    name:"Shimei barna 150 g",   img:"zold/barnashimeji.jpeg",unit:"csomag", price:520 },
        { id:"ordog",          name:"Ördögszekér gomba 4kg", img:"zold/ordog.jpg",     unit:"csomag", price:4600 },
        { id:"shitake",        name:"Shiitake gomba 500g", img:"zold/shitake.jpg",      unit:"csomag", price:4500 }
      ]}
    ]
  },
  {
    id: "gyumolcs", label: "Gyümölcsök",
    groups: [
      { label: "Almafélék", items: [
        { id:"gala",   name:"Alma apró/iskolás", img:"gyum/gala.jpg",  unit:"kg", price:350 },
        { id:"pink", name:"Alma Pink Lady",       img:"gyum/golden.jpg",unit:"kg", price:690 },
        { id:"grany",  name:"Alma Grany Smith",  img:"gyum/grany.jpg", unit:"kg", price:990 },
        { id:"ida",    name:"Alma Idared",       img:"gyum/ida.jpg",   unit:"kg", price:420 }
      ]},
      { label: "Citrusfélék", items: [
        { id:"citrom",      name:"Citrom",     img:"gyum/citrom.jpg", unit:"kg", price:1100 },
        { id:"grapefruit",  name:"Grapefruit", img:"gyum/grapefruit.jpg", unit:"kg", price:950 },
        { id:"lime",        name:"Lime",       img:"gyum/lime.jpg",   unit:"kg", price:1550 },
        { id:"mandi",       name:"Mandarin",   img:"gyum/mandi.jpg",  unit:"kg", price:910 },
        { id:"nari",        name:"Narancs",    img:"gyum/nari.jpg",   unit:"kg", price:550 }
      ]},
      { label: "Bogyósok", items: [
        { id:"afonya",  name:"Áfonya 125g",  img:"gyum/afonya.jpg", unit:"doboz", price:820 },
        { id:"szeder",    name:"Szeder 125g",    img:"gyum/szeder.png",   unit:"doboz", price:1490 },
        { id:"malna",   name:"Málna 125g",   img:"gyum/malna.jpg",  unit:"doboz", price:1090 },
        { id:"ribizli", name:"Ribizli 125g", img:"gyum/ribizli.jpg",unit:"doboz", price:1490 }
      ]},
      { label: "Dinnyék", items: [
        { id:"gorogd",  name:"Görög dinnye", img:"gyum/gorogd.jpg",  unit:"kg", price:320 },
        { id:"sargadi", name:"Sárgadinnye",  img:"gyum/sargadi.jpg", unit:"kg", price:420 }
      ]},
      { label: "Trópusi gyümölcsök", items: [
        { id:"ana",        name:"Ananász", img:"gyum/ana.jpg", unit:"db", price:650 },
        { id:"avo",        name:"Avokádó", img:"gyum/avo.jpg", unit:"db", price:700 },
        { id:"hassavo",    name:"Avokádó Haas (konyhakész)", img:"gyum/hassavo.jpg", unit:"db", price:525 },
        { id:"banan",      name:"Banán",   img:"gyum/banan.jpg",unit:"kg", price:590 },
        { id:"kiwi",       name:"Kiwi",    img:"gyum/kiwi.jpg", unit:"kg", price:1580 },
        { id:"passion",    name:"Passion Fruit", img:"gyum/passion.jpg", unit:"kg", price:6750 },
        { id:"mangó",      name:"Mangó",   img:"gyum/mango.jpg", unit:"db", price:775 },
        { id:"karambola",  name:"Karambola", img:"gyum/karambola.jpg", unit:"db", price:1090 }
      ]},
      { label: "Egyéb gyümölcsök", items: [
        { id:"physalis", name:"Physalis 125g", img:"gyum/physalis.jpg", unit:"db", price:490 },
        { id:"granat", name:"Gránátalma", img:"gyum/granat.jpg", unit:"db", price:750 },
        { id:"korte",  name:"Körte",      img:"gyum/korte.jpg",  unit:"kg", price:850 },
        { id:"neki",   name:"Nektarin",   img:"gyum/neki.jpg",   unit:"kg", price:750 },
        { id:"oszi",   name:"Őszibarack", img:"gyum/oszi.jpg",   unit:"kg", price:750 },
        { id:"sargab", name:"Sárgabarack",img:"gyum/sargab.jpg", unit:"kg", price:740 },
        { id:"szolo",  name:"Szőlő",      img:"gyum/szolo.jpg",  unit:"kg", price:1700 },
        { id:"szilva", name:"Szilva",     img:"gyum/szilva.jpg", unit:"kg", price:1490 }
      ]}
    ]
  },
  {
    id: "fuszer", label: "Fűszerek, csírák",
    groups: [
      { label: "Csírák", items: [
        { id:"retekcsira",  name:"Retek csíra",       img:"csir/retekcsira.jpg", unit:"doboz", price:990 },
        { id:"hagymacsira", name:"Hagyma csíra",      img:"csir/hagymacsira.png",unit:"doboz", price:1100 },
        { id:"borsocsira",  name:"Borsó hajtás csíra",img:"csir/borsocsira.jpg", unit:"doboz", price:1200 },
        { id:"mikromix",  name:"MikroMix borsó hajtás 60g",img:"csir/mikromix.png", unit:"doboz", price:1200 },
        { id:"ehetovirag",  name:"Ehető virág",img:"csir/virag.jpg", unit:"doboz", price:1790 },
        { id:"ceruzabab",  name:"Ceruzabab",img:"csir/ceruzabab.jpeg", unit:"doboz", price:1400 },
        { id:"cukorborso",  name:"Cukorborsó",img:"csir/cukorborso.jpg", unit:"doboz", price:1400 },
        { id:"citromnad",  name:"Citromnád 500g",img:"csir/citromnad.jpg", unit:"doboz", price:3590 },
      ]},
      { label: "Friss fűszerek", items: [
        { id:"bazsi",   name:"Bazsalikom",          img:"csir/bazsi.jpg",   unit:"köteg", price:750 },
        { id:"gyombi",  name:"Gyömbér",             img:"csir/gyombi.png",  unit:"kg", price:1790 },
        { id:"kakukk",  name:"Kakukkfű",            img:"csir/kakukk.jpg",  unit:"köteg", price:950 },
        { id:"kapor",   name:"Kapor",               img:"csir/kapor.jpg",   unit:"köteg", price:690 },
        { id:"kori",    name:"Koriander",           img:"csir/kori.jpg",    unit:"köteg", price:690 },
        { id:"menta",   name:"Menta",               img:"csir/menta.jpg",   unit:"köteg", price:690 },
        { id:"peti",    name:"Petrezselyem zöldje", img:"csir/peti.png",    unit:"köteg", price:450 },
        { id:"francia",    name:"Fodros petrezselyem",           img:"csir/francia.jpg",    unit:"köteg", price:490 },
        { id:"zellerzold",    name:"Zellerzöld",           img:"csir/zellerzold.jpg",    unit:"köteg", price:490 },
        { id:"rozi",    name:"Rozmaring",           img:"csir/rozi.jpg",    unit:"köteg", price:890 },
        { id:"snid",    name:"Snidling",            img:"csir/snid.jpg",    unit:"köteg", price:990 },
        { id:"takony",  name:"Tárkony",             img:"csir/takony.jpg",  unit:"köteg", price:990 },
        { id:"turbi",   name:"Turbolya",            img:"csir/turbi.jpg",   unit:"köteg", price:990 },
        { id:"zsalya",  name:"Zsálya",              img:"csir/zsalya.jpg",  unit:"köteg", price:990 },
        { id:"majoranna",  name:"Majoranna",              img:"csir/majoranna.jpg",  unit:"köteg", price:990 },
        { id:"lestyan",  name:"Lestyán",              img:"csir/lestyan.jpg",  unit:"köteg", price:990 },
      ]}
    ]
  },
  {
    id: "savanyu", label: "Savanyúságok",
    groups: [
      { label: "Paprikák", items: [
        { id:"simalmapap", name:"Almapaprika",         img:"sav/simalmapap.jpg", options:[{label:"5 kg",price:5340},{label:"10 kg",price:9490}] },
        { id:"almapap",    name:"Töltött almapaprika", img:"sav/almapap.jpg",    options:[{label:"5 kg",price:5340},{label:"10 kg",price:9490}] },
        { id:"cseresznyepaprika",    name:"Cseresznyepaprika", img:"sav/cseresznyepaprika.jpg",    options:[{label:"5 kg",price:6500},{label:"10 kg",price:11190}] },
        { id:"pepperoni",    name:"Pepperoni", img:"sav/pepperoni.jpg",    options:[{label:"5 kg",price:6500},{label:"10 kg",price:11190}] },
      ]},
      { label: "Uborkák", items: [
        { id:"csem", name:"Csemege uborka", img:"sav/csemubi.jpg", options:[{label:"5 kg",price:5340},{label:"10 kg",price:9490}] },
        { id:"kovi", name:"Kovászos uborka",img:"sav/koviubi.jpg", options:[{label:"5 kg",price:5340},{label:"10 kg",price:9490}] }
      ]},
      { label: "Káposztafélék", items: [
        { id:"csala",  name:"Csalamádé",        img:"sav/vegyees.jpg",  options:[{label:"5 kg",price:3800},{label:"15 kg",price:8900}] },
        { id:"kaposztasalata",  name:"Káposztasaláta",        img:"sav/kaposztasalata.jpg",  options:[{label:"5 kg",price:3800},{label:"15 kg",price:8900}] },
        { id:"savkap", name:"Savanyú Káposzta", img:"sav/savkap.jpg", options:[{label:"1 kg",price:670},{label:"5 kg",price:3300},{label:"17 kg",price:9200}] },
        { id:"sav_fej", name:"Savanyú Káposzta Fej", img:"sav/sav_fej.jpg", options:[{label:"1 kg",price:670},{label:"5 kg",price:3300},{label:"17 kg",price:9200}] }
      ]},
      { label: "Egyéb", items: [
        { id:"cekla-s", name:"Cékla",        img:"sav/cekla.jpg",  options:[{label:"5 kg",price:5340},{label:"15 kg",price:16020}] },
        { id:"karfiol", name:"Ecetes karfiol",        img:"sav/karfiol.jpg",  options:[{label:"5 kg",price:5340},{label:"15 kg",price:16020}] },
        { id:"torma", name:"Torma",        img:"sav/torma.jpg",  options:[{label:"5 kg",price:5340},{label:"15 kg",price:16020}] },
        { id:"gyongy",  name:"Gyöngyhagyma", img:"sav/gyongy.jpg",  options:[{label:"5 kg",price:9000},{label:"10 kg",price:16000}] }
      ]}
    ]
  },
  {
    id: "salatak", label: "Saláták",
    groups: [
      { label: "Saláták", items: [
        { id:"jegsalata",  name:"Jégsaláta",        img:"sals/jeg.jpg",         unit:"db", price:450 },
        { id:"fejes",      name:"Fejes saláta",     img:"sals/fejes.jpg",       unit:"db", price:260 },
        { id:"lollo",      name:"Lollo saláta zöld",img:"sals/lollo.jpg",       unit:"db", price:450 },
        { id:"madar",      name:"Madársaláta",      img:"sals/madar.jpg",       unit:"doboz", price:590 },
        { id:"rukkola",    name:"Rukkola",          img:"sals/rukkola.jpg",     unit:"doboz", price:500 },
        { id:"ceklalevél", name:"Céklalevél",       img:"sals/cekla.jpg",       unit:"doboz", price:500 },
        { id:"mix",        name:"Mix saláta",       img:"sals/mix.jpg",         unit:"doboz", price:500 },
        { id:"bebispenot", name:"Bébi spenót",      img:"sals/bebispenot.jpg",  unit:"doboz", price:500 },
        { id:"romai",      name:"Római saláta",     img:"sals/romaisalata.jpg", unit:"db", price:1490 },
        { id:"bebiromai",  name:"Bébi római saláta",img:"sals/bebiromai.jpg",   unit:"csomag", price:1290 },
        { id:"radicchio",  name:"Radicchio",        img:"sals/radicchio.jpg",   unit:"kg", price:2290 },
        { id:"edeskomeny", name:"Édeskömény",       img:"sals/edeskomeny.png",  unit:"db", price:970 }
      ]}
    ]
  },
  {
    id: "tisztitott", label: "Tisztított zöldségek",
    groups: [
      { label: "Burgonya", items: [
        { id:"t-burgonya-egesz",  name:"Burgonya Egész", img:"tisz/burgonya-egesz.jpg",     unit:"kg", price:410, minQty:5, qtyStep:1 },
        { id:"t-burgonya-karika", name:"Burgonya Karika",img:"tisz/burgonya-karika.jpg",    unit:"kg", price:410, minQty:5, qtyStep:1 },
        { id:"t-burgonya-hasab",  name:"Burgonya Hasáb", img:"tisz/burgonya-nagyhasab.jpg", unit:"kg", price:410, minQty:5, qtyStep:1 },
        { id:"t-burgonya-kocka",  name:"Burgonya Kocka", img:"tisz/burgonya-nagykocka.jpg", unit:"kg", price:410, minQty:5, qtyStep:1 },
        { id:"t-burgonya-parazs", name:"Burgonya Parázs",img:"tisz/burgonya-parazs.jpg",    unit:"kg", price:360, minQty:5, qtyStep:1 }
      ]},
      { label: "Káposztafélék", items: [
        { id:"t-fejeskaposzta-reszelt", name:"Fejeskáposzta Reszelt",img:"tisz/fejeskaposzta-reszelt.jpg",    unit:"kg", price:390, minQty:5, qtyStep:1 },
        { id:"t-fejeskaposzta-csik",    name:"Fejeskáposzta Csík",   img:"tisz/fejeskaposzta-vastag-csik.jpg",unit:"kg", price:390, minQty:5, qtyStep:1 },
        { id:"t-kelkaposzta-csik",      name:"Kelkáposzta Csík",     img:"tisz/kelkaposzta-vastag-csik.jpg",  unit:"kg", price:390, minQty:5, qtyStep:1 },
        { id:"t-lilakaposzta-csik",     name:"Lilakáposzta Csík",    img:"tisz/voroskaposzta-vekony-csik.jpg",unit:"kg", price:390, minQty:5, qtyStep:1 },
        { id:"fejes_szelet",     name:"Fejeskáposzta Szeletelve",    img:"tisz/fejes_szelet.jpg",unit:"kg", price:390, minQty:5, qtyStep:1 },
        { id:"kel_szelet",     name:"Kelkáposzta Szeletelve",    img:"tisz/kel_szelet.jpg",unit:"kg", price:390, minQty:5, qtyStep:1 },
      ]},
      { label: "Gyökérzöldségek", items: [
        { id:"t-zeller-egesz",        name:"Zeller Egész",        img:"tisz/zeller-egesz.jpg",         unit:"kg", price:570, minQty:5, qtyStep:1 },
        { id:"t-karalabe-egesz",      name:"Karalábé Egész",      img:"tisz/karalabe-egesz.png",       unit:"kg", price:595, minQty:5, qtyStep:1 },
        { id:"t-repa-egesz",          name:"Répa Egész",          img:"tisz/repa-egesz.jpg",           unit:"kg", price:570, minQty:5, qtyStep:1 },
        { id:"t-repa-karika",         name:"Répa Karika",         img:"tisz/repa-karika.jpg",          unit:"kg", price:570, minQty:5, qtyStep:1 },
        { id:"t-petrezselyem-egesz",  name:"Petrezselyem Egész",  img:"tisz/petrezselyem-egesz.jpg",   unit:"kg", price:950, minQty:5, qtyStep:1 },
        { id:"t-petrezselyem-karika", name:"Petrezselyem Karika", img:"tisz/petrezselyem-karika.jpg",  unit:"kg", price:950, minQty:5, qtyStep:1 },
        { id:"t-petrezselyem-kocka",  name:"Petrezselyem Kocka",  img:"tisz/petrezselyem-kiskocka.jpg",unit:"kg", price:950, minQty:5, qtyStep:1 }
      ]},
      { label: "Hagymafélék", items: [
        { id:"t-voroshagyma-egesz",  name:"Vöröshagyma Egész",  img:"tisz/voroshagyma-egesz.jpg",  unit:"kg", price:450, minQty:5, qtyStep:1 },
        { id:"t-voroshagyma-karika", name:"Vöröshagyma Karika", img:"tisz/voroshagyma-karika.jpg", unit:"kg", price:450, minQty:5, qtyStep:1 },
        { id:"t-lilahagyma-egesz",   name:"Lilahagyma Egész",   img:"tisz/lilahagyma-egesz.jpg",   unit:"kg", price:550, minQty:5, qtyStep:1 },
        { id:"t-lilahagyma-karika",  name:"Lilahagyma Karika",  img:"tisz/lilahagyma-karika.jpg",  unit:"kg", price:550, minQty:5, qtyStep:1 },
        { id:"t-foki",               name:"Fokhagyma tisztított",img:"tisz/foki.jpg",              unit:"kg", price:2190 }
      ]}
    ]
  },
  {
    id: "tojas", label: "Tojás",
    groups: [
      { label: "Tojások", items: [
        { id:"talcas",  name:"Friss tálcás tojás M-es",  img:"tojas/talca30.jpg",  unit:"db", price:69, minQty:30, qtyStep:30 },
          { id:"karton",  name:"1 karton friss tojás M-es 360 db",  img:"tojas/karton.jpg",  unit:"karton", price:24840, },
        { id:"dobozos", name:"Friss dobozos tojás M-es", img:"tojas/dobozos.jpg",  unit:"db", price:690 },
        { id:"furj",    name:"Fürj tojás 24db",          img:"tojas/furj.jpg",     unit:"csomag", price:1400 }
      ]}
    ]
  },
  {
  id: "szarazaru", label: "Szárazáru",
  groups: [
    {
      label: "Diófélék",
      items: [
        { id:"diobel",              name:"Dióbél",                     img:"szarazaru/diobel.jpg",              unit:"kg", price:3700 },
        { id:"daraltdio",           name:"Darált dió",                 img:"szarazaru/daraltdio.jpg",           unit:"kg", price:3700 },
        { id:"mandulabel",          name:"Mandulabél, hántolatlan",    img:"szarazaru/mandulabel.jpg",          unit:"kg", price:5900 },
        { id:"mandulabelszeletelt", name:"Mandulabél, szeletelt",      img:"szarazaru/mandulabelszeletelt.jpg", unit:"kg", price:6700 },
        { id:"kesudio",             name:"Kesudió 1 kg",               img:"szarazaru/kesudio.jpg",             unit:"db", price:6400 },
        { id:"pisztacia",           name:"Pisztácia héjas 1 kg",       img:"szarazaru/pisztacia.jpg",           unit:"db", price:3900 },
        { id:"pekandio",            name:"Pekándió 1 kg",              img:"szarazaru/pekandio.jpg",            unit:"db", price:7500 },
        { id:"torokmogyoro",        name:"Törökmogyoró 1 kg",          img:"szarazaru/torokmogyoro.jpg",        unit:"db", price:9900 },
      ]
    },
    {
      label: "Magvak",
      items: [
        { id:"mak",  name:"Darált mák", img:"szarazaru/mak.jpg",  unit:"kg", price:1990 },
        { id:"chia", name:"Chia mag",   img:"szarazaru/chia.jpg", options:[{label:"1 kg",price:2500},{label:"5 kg",price:11990}] },
        { id:"mogyoro",  name:"Földimogyoró 5kg", img:"szarazaru/mogyoro.jpg",  unit:"db", price:9490 },
      ]
    },
    {
      label: "Hüvelyesek",
      items: [
        { id:"tarkabab",     name:"Tarkabab",              img:"szarazaru/tarkabab.jpg",     options:[{label:"500g",price:420},{label:"5 kg",price:3600}] },
        { id:"lencse",       name:"Lencse",                img:"szarazaru/lencse.jpg",       options:[{label:"500g",price:420},{label:"5 kg",price:3600}] },
        { id:"voroslencse",  name:"Vöröslencse",           img:"szarazaru/voroslencse.jpg",  options:[{label:"1 kg",price:660},{label:"5 kg",price:3090}] },
        { id:"feketelencse", name:"Fekete lencse, Beluga", img:"szarazaru/feketelencse.jpg", options:[{label:"1 kg",price:1390},{label:"5 kg",price:6990}] },
        { id:"csicseri",     name:"Csicseriborsó",         img:"szarazaru/csicseri.jpg",     options:[{label:"1 kg",price:800},{label:"5 kg",price:3900}] },
        { id:"sargaborso",   name:"Sárgaborsó 5 kg",       img:"szarazaru/sargaborso.jpg",   unit:"db", price:1675 },
        { id:"feherbab",     name:"Fehérbab 5 kg",         img:"szarazaru/feherbab.jpg",     unit:"db", price:1675 },
        { id:"gyongybab",    name:"Gyöngybab 5 kg",        img:"szarazaru/gyongybab.jpg",    unit:"db", price:1675 },
        { id:"feketebab",    name:"Feketebab",             img:"szarazaru/feketebab.jpg",    options:[{label:"1 kg",price:1000},{label:"5 kg",price:5000}] },
      ]
    },
    {
      label: "Gabonafélék",
      items: [
        { id:"bulgur",   name:"Bulgur",  img:"szarazaru/burlgur.jpg", options:[{label:"1 kg",price:615},{label:"5 kg",price:2990}] },
        { id:"koles",    name:"Köles",   img:"szarazaru/koles.jpg",   options:[{label:"1 kg",price:700},{label:"5 kg",price:3090}] },
        { id:"hajdina",  name:"Hajdina", img:"szarazaru/hajdina.jpg", options:[{label:"natúr",price:940},{label:"pörkölt",price:940}] },
        { id:"csoveskukorica",    name:"Csemege kukorica",        img:"szarazaru/csemegekukorica.jpg",    unit:"db", price:200 },
      ]
    },
    {
      label: "Aszalványok",
      items: [
        { id:"bananchips", name:"Banánchips", img:"szarazaru/bananchips.jpg", unit:"kg", price:2600 },
        { id:"aranymazsola", name:"Arany mazsola", img:"szarazaru/aranymazsola.jpg", options:[{label:"1 kg",price:3290},{label:"5 kg",price:15990}] },
        { id:"aszaltbarack", name:"Aszalt sárgabarack", img:"szarazaru/aszaltbarack.jpg", unit:"kg", price:6990 },
        { id:"aszaltszilva", name:"Aszalt szilva", img:"szarazaru/aszaltszilva.jpg", unit:"kg", price:2900 },
        { id:"aszaltafonya", name:"Aszalt vörös áfonya", img:"szarazaru/aszaltafonya.jpg", unit:"kg", price:2900 },
        { id:"mazsola", name:"Mazsola 100g", img:"szarazaru/mazsola.jpg", unit:"db", price:215 },
      ]
    }
  ]
  },
  {
    id: "teszta", label: "Tészták",
    groups: [
      { label: "Tészták", items: [
        { id:"t-cernametelt",  name:"Cérnametélt 10kg",    img:"teszta/cernametelt.jpg",  unit:"kg", price:14990 },
        { id:"t-csigateszta",  name:"Csiga tészta 200g",   img:"teszta/csiga.jpg",  unit:"kg", price:350 },
        { id:"t-eperlevel",    name:"Eperlevél 200g",      img:"teszta/eperlevel.jpg",    unit:"kg", price:280 },
        { id:"t-eperszalag",   name:"Eperszalag 200g",     img:"teszta/eperszalag.jpg",   unit:"kg", price:280 },
        { id:"t-fodroskocka",  name:"Fodroskocka 10kg",    img:"teszta/fodroskocka.jpg",  unit:"kg", price:14990 },
        { id:"t-kagylo",       name:"Nagy kagyló 10kg",         img:"teszta/kagylo.jpg",       unit:"kg", price:14990 },
        { id:"t-kiskocka",     name:"Kiskocka 10kg",       img:"teszta/kiskocka.jpg",     unit:"kg", price:14990 },
        { id:"t-orso",         name:"Orsó 10kg",           img:"teszta/orso.jpg",         unit:"kg", price:14990 },
        { id:"t-penne",        name:"Penne 10kg",          img:"teszta/penne.jpg",        unit:"kg", price:14990 },
        { id:"t-rovidcso",     name:"Rövidcső 10kg",       img:"teszta/rovidcso.jpg",     unit:"kg", price:14990 },
        { id:"t-spagetti",     name:"Spagetti 10kg",       img:"teszta/spagetti.jpg",     unit:"kg", price:14990 },
        { id:"t-szarvacska",   name:"Szarvacska 10kg",     img:"teszta/szarvacska.jpg",   unit:"kg", price:14990 },
        { id:"t-szelesmetelt", name:"Szélesmetélt 10kg",   img:"teszta/szelesmetelt.jpg", unit:"kg", price:14990 },
        { id:"t-tarhonya",     name:"Tarhonya 10kg",       img:"teszta/tarhonya.jpg",     unit:"kg", price:14990 }
      ]}
    ]
  }
];

function getVatRate(catId) {
  return catId === "tojas" ? 5 : 27;
}

function findItem(pid) {
  for (const cat of CATALOG) {
    for (const grp of cat.groups) {
      for (const item of grp.items) {
        if (item.id === pid) {
          return { item, catId: cat.id };
        }
      }
    }
  }
  return null;
}

module.exports = { CATALOG, getVatRate, findItem };
