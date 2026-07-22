/**
 * EGYETLEN igazságforrás a termékadatokhoz (ár, ÁFA, kép, kiszerelés).
 * Ezt a fájlt a /api/catalog végpont szolgálja ki a webshop.html-nek, ÉS
 * ugyanez alapján validálja/számolja az árakat a create-checkout-session.js
 * is. Árváltozásnál MOSTANTÓL CSAK EZT a fájlt kell módosítanod.
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
        { id:"ujhagyma",       name:"Újhagyma",        img:"zold/ujhagyma.jpg",       unit:"csomó", price:320 }
      ]},
      { label: "Káposztafélék", items: [
        { id:"Broccoli",       name:"Brokkoli",              img:"zold/Broccoli.jpg",      unit:"kg", price:1600 },
        { id:"fejeskapi",      name:"Fejes káposzta",        img:"zold/fejeskapi.jpg",     unit:"kg", price:220 },
        { id:"karal",          name:"Karalábé",              img:"zold/karal.jpg",         unit:"db", price:280 },
        { id:"karfiol",        name:"Karfiol",               img:"zold/karfiol.jpg",       unit:"kg", price:500 },
        { id:"kelkapi",        name:"Kelkáposzta",           img:"zold/kelkapi.jpg",       unit:"kg", price:490 },
        { id:"lilakapi",       name:"Lila káposzta",         img:"zold/lilakapi.jpg",      unit:"kg", price:220 },
        { id:"Pak-choi",       name:"Pak-choi",              img:"zold/Pak-choi.jpg",      unit:"kg", price:1400 }
      ]},
      { label: "Paprikafélek", items: [
        { id:"tv",             name:"Tv paprika",                    img:"zold/tv.jpg",       unit:"kg", price:650 },
        { id:"eros",           name:"Hegyes erős (extra)",           img:"zold/eros.jpg",     unit:"db", price:160 },
        { id:"tricolor",       name:"Kaliforniai paprika (Tricolor)",img:"zold/tricolor.jpg", unit:"kg", price:1995 },
        { id:"kalif",          name:"Kaliforniai paprika (Piros)",   img:"zold/kalif.jpg",    unit:"kg", price:1290 },
        { id:"chili",          name:"Chili paprika",                 img:"zold/chili.jpg",    unit:"kg", price:7800 },
        { id:"kapia",          name:"Kápia",                         img:"zold/kapia.jpg",    unit:"kg", price:1290 }
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
        { id:"pirosretek",     name:"Piros retek",        img:"zold/pirosretek.jpg",    unit:"csomó", price:350 },
        { id:"zellergumo",     name:"Zellergumó",         img:"zold/zellergumo.jpg",    unit:"kg", price:295 },
        { id:"angolzeller",    name:"Angol zeller",       img:"zold/angolzeller.jpg",   unit:"csomag", price:570 },
        { id:"jegcsap",        name:"Jégcsapretek",       img:"zold/jegcsap.jpg",       unit:"kg", price:590 }
      ]},
      { label: "Tökfélék", items: [
        { id:"kigyo",          name:"Kígyó uborka", img:"zold/kigyo.jpg",     unit:"kg", price:590 },
        { id:"furtosubi",      name:"Fürtös uborka",img:"zold/furtosubi.jpg", unit:"kg", price:690 },
        { id:"cukkini",        name:"Cukkini",img:"zold/cukkini.jpg", unit:"kg", price:550 },
        { id:"sutotok",        name:"Sütőtök",img:"zold/sutotok.jpg", unit:"kg", price:590 },
        { id:"fozotok",        name:"Főzőtök",img:"zold/fozo.jpg", unit:"kg", price:490 },
        { id:"padlizsan",      name:"Padlizsán",img:"zold/padlizsan.jpg", unit:"kg", price:800 }
      ]},
      { label: "Gombák", items: [
        { id:"gomba",          name:"Gomba Csiperke", img:"zold/gomba.jpg",        unit:"0,5 kg/csomag", price:690 },
        { id:"barnagomba",     name:"Barna Csiperke", img:"zold/barnacsiperke.jpg", unit:"0,5 kg/csomag", price:690 },
        { id:"laska",          name:"Laskagomba",     img:"zold/laska.jpg",        unit:"0,5 kg/csomag", price:899 },
        { id:"shimei",         name:"Shimei fehér",   img:"zold/shimeji.jpg",      unit:"150 g/csomag", price:520 },
        { id:"shimeibarna",    name:"Shimei barna",   img:"zold/barnashimeji.jpeg",unit:"150 g/csomag", price:520 },
        { id:"ordog",          name:"Ördögszekér gomba", img:"zold/ordog.jpg",     unit:"2 kg/csomag", price:4600 },
        { id:"shitake",        name:"Shiitake gomba", img:"zold/shitake.jpg",      unit:"0,5 kg/csomag", price:4500 }
      ]}
    ]
  },
  {
    id: "gyumolcs", label: "Gyümölcsök",
    groups: [
      { label: "Almafélék", items: [
        { id:"gala",   name:"Alma apró/iskolás", img:"gyum/gala.jpg",  unit:"kg", price:350 },
        { id:"golden", name:"Alma Golden",       img:"gyum/golden.jpg",unit:"kg", price:450 },
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
        { id:"afonya",  name:"Áfonya",  img:"gyum/afonya.jpg", unit:"125g/doboz", price:650 },
        { id:"eper",    name:"Eper",    img:"gyum/eper.jpg",   unit:"kg", price:0 },
        { id:"malna",   name:"Málna",   img:"gyum/malna.jpg",  unit:"125g/doboz", price:1690 },
        { id:"ribizli", name:"Ribizli", img:"gyum/ribizli.jpg",unit:"125g/doboz", price:1990 }
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
        { id:"passion",    name:"Passion Fruit", img:"gyum/passion.jpg", unit:"kg", price:12500 },
        { id:"mangó",      name:"Mangó",   img:"gyum/mango.jpg", unit:"db", price:775 },
        { id:"karambola",  name:"Karambola", img:"gyum/karambola.jpg", unit:"db", price:1090 }
      ]},
      { label: "Egyéb gyümölcsök", items: [
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
        { id:"borsocsira",  name:"Borsó hajtás csíra",img:"csir/borsocsira.jpg", unit:"doboz", price:1300 }
      ]},
      { label: "Friss fűszerek", items: [
        { id:"bazsi",   name:"Bazsalikom",          img:"csir/bazsi.jpg",   unit:"köteg", price:750 },
        { id:"gyombi",  name:"Gyömbér",             img:"csir/gyombi.png",  unit:"kg", price:1790 },
        { id:"kakukk",  name:"Kakukkfű",            img:"csir/kakukk.jpg",  unit:"köteg", price:950 },
        { id:"kapor",   name:"Kapor",               img:"csir/kapor.jpg",   unit:"köteg", price:690 },
        { id:"kori",    name:"Koriander",           img:"csir/kori.jpg",    unit:"köteg", price:690 },
        { id:"menta",   name:"Menta",               img:"csir/menta.jpg",   unit:"köteg", price:690 },
        { id:"peti",    name:"Petrezselyem zöldje", img:"csir/peti.png",    unit:"köteg", price:450 },
        { id:"rozi",    name:"Rozmaring",           img:"csir/rozi.jpg",    unit:"köteg", price:890 },
        { id:"snid",    name:"Snidling",            img:"csir/snid.jpg",    unit:"köteg", price:990 },
        { id:"takony",  name:"Tárkony",             img:"csir/takony.jpg",  unit:"köteg", price:990 },
        { id:"turbi",   name:"Turbolya",            img:"csir/turbi.jpg",   unit:"köteg", price:990 },
        { id:"zsalya",  name:"Zsálya",              img:"csir/zsalya.jpg",  unit:"köteg", price:990 }
      ]}
    ]
  },
  {
    id: "savanyu", label: "Savanyúságok",
    groups: [
      { label: "Paprikák", items: [
        { id:"simalmapap", name:"Almapaprika",         img:"sav/simalmapap.webp", options:[{label:"5 kg",price:5340},{label:"10 kg",price:9490}] },
        { id:"almapap",    name:"Töltött almapaprika", img:"sav/almapap.webp",    options:[{label:"5 kg",price:0},{label:"10 kg",price:0}] },
        { id:"toltottpap", name:"Töltött paprika",     img:"sav/toltottpap.webp", options:[{label:"5 kg",price:0},{label:"10 kg",price:0}] }
      ]},
      { label: "Uborkák", items: [
        { id:"csem", name:"Csemege uborka", img:"sav/csem.webp", options:[{label:"5 kg",price:5340},{label:"10 kg",price:9490}] },
        { id:"kovi", name:"Kovászos uborka",img:"sav/kovi.webp", options:[{label:"5 kg",price:5340},{label:"10 kg",price:9490}] }
      ]},
      { label: "Káposztafélék", items: [
        { id:"csala",  name:"Csalamádé",        img:"sav/csala.webp",  options:[{label:"5 kg",price:3790},{label:"15 kg",price:8900}] },
        { id:"savkap", name:"Savanyú Káposzta", img:"sav/savkap.webp", options:[{label:"1 kg",price:670},{label:"5 kg",price:3300},{label:"17 kg",price:9200}] }
      ]},
      { label: "Egyéb", items: [
        { id:"cekla-s", name:"Cékla",        img:"sav/cekla.webp",  options:[{label:"5 kg",price:5340},{label:"15 kg",price:16020}] },
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
        { id:"t-burgonya-egesz",  name:"Burgonya Egész", img:"tisz/burgonya-egesz.jpg",     unit:"kg", price:410 },
        { id:"t-burgonya-karika", name:"Burgonya Karika",img:"tisz/burgonya-karika.jpg",    unit:"kg", price:410 },
        { id:"t-burgonya-hasab",  name:"Burgonya Hasáb", img:"tisz/burgonya-nagyhasab.jpg", unit:"kg", price:410 },
        { id:"t-burgonya-kocka",  name:"Burgonya Kocka", img:"tisz/burgonya-nagykocka.jpg", unit:"kg", price:410 },
        { id:"t-burgonya-parazs", name:"Burgonya Parázs",img:"tisz/burgonya-parazs.jpg",    unit:"kg", price:360 }
      ]},
      { label: "Káposztafélék", items: [
        { id:"t-fejeskaposzta-reszelt", name:"Fejeskáposzta Reszelt",img:"tisz/fejeskaposzta-reszelt.jpg",    unit:"kg", price:390 },
        { id:"t-fejeskaposzta-csik",    name:"Fejeskáposzta Csík",   img:"tisz/fejeskaposzta-vastag-csik.jpg",unit:"kg", price:390 },
        { id:"t-kelkaposzta-csik",      name:"Kelkáposzta Csík",     img:"tisz/kelkaposzta-vastag-csik.jpg",  unit:"kg", price:390 },
        { id:"t-lilakaposzta-csik",     name:"Lilakáposzta Csík",    img:"tisz/voroskaposzta-vekony-csik.jpg",unit:"kg", price:390 }
      ]},
      { label: "Gyökérzöldségek", items: [
        { id:"t-zeller-egesz",        name:"Zeller Egész",        img:"tisz/zeller-egesz.jpg",         unit:"kg", price:570 },
        { id:"t-karalabe-egesz",      name:"Karalábé Egész",      img:"tisz/karalabe-egesz.png",       unit:"kg", price:595 },
        { id:"t-repa-egesz",          name:"Répa Egész",          img:"tisz/repa-egesz.jpg",           unit:"kg", price:570 },
        { id:"t-repa-karika",         name:"Répa Karika",         img:"tisz/repa-karika.jpg",          unit:"kg", price:570 },
        { id:"t-petrezselyem-egesz",  name:"Petrezselyem Egész",  img:"tisz/petrezselyem-egesz.jpg",   unit:"kg", price:950 },
        { id:"t-petrezselyem-karika", name:"Petrezselyem Karika", img:"tisz/petrezselyem-karika.jpg",  unit:"kg", price:950 },
        { id:"t-petrezselyem-kocka",  name:"Petrezselyem Kocka",  img:"tisz/petrezselyem-kiskocka.jpg",unit:"kg", price:950 }
      ]},
      { label: "Hagymafélék", items: [
        { id:"t-voroshagyma-egesz",  name:"Vöröshagyma Egész",  img:"tisz/voroshagyma-egesz.jpg",  unit:"kg", price:450 },
        { id:"t-voroshagyma-karika", name:"Vöröshagyma Karika", img:"tisz/voroshagyma-karika.jpg", unit:"kg", price:450 },
        { id:"t-lilahagyma-egesz",   name:"Lilahagyma Egész",   img:"tisz/lilahagyma-egesz.jpg",   unit:"kg", price:550 },
        { id:"t-lilahagyma-karika",  name:"Lilahagyma Karika",  img:"tisz/lilahagyma-karika.jpg",  unit:"kg", price:550 },
        { id:"t-foki",               name:"Fokhagyma tisztított",img:"tisz/foki.jpg",              unit:"kg", price:2190 }
      ]}
    ]
  },
  {
    id: "tojas", label: "Tojás",
    groups: [
      { label: "Tojások", items: [
        { id:"talcas",  name:"Friss tálcás tojás M-es",  img:"tojas/talca30.jpg",  unit:"db", price:69, minQty:30, qtyStep:30 },
        { id:"dobozos", name:"Friss dobozos tojás M-es", img:"tojas/dobozos.jpg",  unit:"db", price:690 },
        { id:"furj",    name:"Fürj tojás 24db",          img:"tojas/furj.jpg",     unit:"csomag", price:1400 }
      ]}
    ]
  },
  {
    id: "szarazaru", label: "Szárazáru",
    groups: [
      { label: "Magvak, aromák", items: [
        { id:"diobel",     name:"Dióbél",         img:"szarazaru/diobel.jpg",     unit:"kg", price:3700 },
        { id:"daaltdio",   name:"Darált dió",     img:"szarazaru/daraltdio.jpg",  unit:"kg", price:3700 },
        { id:"mak",        name:"Darált mák 200g",img:"szarazaru/mak.jpg",        unit:"csomag", price:3200 },
        { id:"bulgur",     name:"Bulgur",         img:"szarazaru/burlgur.jpg",    options:[{label:"500g",price:480},{label:"5 kg",price:3000}] },
        { id:"tarkabab",   name:"Tarkabab",       img:"szarazaru/tarkabab.jpg",   options:[{label:"500g",price:480},{label:"5 kg",price:3000}] },
        { id:"lencse",     name:"Lencse",         img:"szarazaru/lencse.jpg",     options:[{label:"500g",price:480},{label:"5 kg",price:3000}] }
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
