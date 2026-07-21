

const CATALOG = [
  {
    id: "zoldseg", label: "Zöldségek",
    groups: [
      { label: "Burgonyafélék", items: [
        { id:"burgonya",       name:"Burgonya",        unit:"kg", price:250 },
        { id:"sargaburgonya",  name:"Burgonya sárga",  unit:"kg", price:360 },
        { id:"parazs",         name:"Burgonya parázs", unit:"kg", price:180 },
        { id:"edesburg",       name:"Édes burgonya",   unit:"kg", price:620 }
      ]},
      { label: "Hagymafélék", items: [
        { id:"voroshagyma",    name:"Vöröshagyma",     unit:"kg", price:250 },
        { id:"foki",           name:"Fokhagyma",       unit:"kg", price:1790 },
        { id:"lilali",         name:"Lilahagyma",      unit:"kg", price:270 },
        { id:"pore",           name:"Póréhagyma",      unit:"db", price:350 },
        { id:"feherhagyma",    name:"Fehérhagyma",     unit:"kg", price:890 },
        { id:"ujhagyma",       name:"Újhagyma",        unit:"csomó", price:320 }
      ]},
      { label: "Káposztafélék", items: [
        { id:"Broccoli",       name:"Brokkoli",              unit:"kg", price:1600 },
        { id:"fejeskapi",      name:"Fejes káposzta",        unit:"kg", price:220 },
        { id:"karal",          name:"Karalábé",              unit:"db", price:280 },
        { id:"karfiol",        name:"Karfiol",               unit:"kg", price:500 },
        { id:"kelkapi",        name:"Kelkáposzta",           unit:"kg", price:490 },
        { id:"lilakapi",       name:"Lila káposzta",         unit:"kg", price:220 },
        { id:"Pak-choi",       name:"Pak-choi",              unit:"kg", price:1400 }
      ]},
      { label: "Paprikafélek", items: [
        { id:"tv",             name:"Tv paprika",                    unit:"kg", price:650 },
        { id:"eros",           name:"Hegyes erős (extra)",           unit:"db", price:160 },
        { id:"tricolor",       name:"Kaliforniai paprika (Tricolor)",unit:"kg", price:1995 },
        { id:"kalif",          name:"Kaliforniai paprika (Piros)",   unit:"kg", price:1290 },
        { id:"chili",          name:"Chili paprika",                 unit:"kg", price:7800 },
        { id:"kapia",          name:"Kápia",                         unit:"kg", price:1290 }
      ]},
      { label: "Paradicsomfélék", items: [
        { id:"pari",           name:"Paradicsom",       unit:"kg", price:450 },
        { id:"koktel",         name:"Koktélparadicsom", unit:"kg", price:1550 },
        { id:"sargakoktel",    name:"Koktélparadicsom sárga", unit:"kg", price:2990 }
      ]},
      { label: "Gyökérzöldségek", items: [
        { id:"repa",           name:"Sárgarépa",          unit:"kg", price:320 },
        { id:"gyoker",         name:"Petrezselyem Gyökér",unit:"kg", price:1099 },
        { id:"cekla-z",        name:"Cékla",              unit:"kg", price:350 },
        { id:"pirosretek",     name:"Piros retek",        unit:"csomó", price:350 },
        { id:"zellergumo",     name:"Zellergumó",         unit:"kg", price:295 },
        { id:"angolzeller",    name:"Angol zeller",       unit:"csomag", price:570 },
        { id:"jegcsap",        name:"Jégcsapretek",       unit:"kg", price:590 }
      ]},
      { label: "Tökfélék", items: [
        { id:"kigyo",          name:"Kígyó uborka", unit:"kg", price:590 },
        { id:"furtosubi",      name:"Fürtös uborka",unit:"kg", price:690 },
        { id:"cukkini",        name:"Cukkini",unit:"kg", price:550 },
        { id:"sutotok",        name:"Sütőtök",unit:"kg", price:590 },
        { id:"fozotok",        name:"Főzőtök",unit:"kg", price:490 },
        { id:"padlizsan",      name:"Padlizsán",unit:"kg", price:800 }
      ]},
      { label: "Gombák", items: [
        { id:"gomba",          name:"Gomba Csiperke", unit:"0,5 kg/csomag", price:690 },
        { id:"barnagomba",     name:"Barna Csiperke", unit:"0,5 kg/csomag", price:690 },
        { id:"laska",          name:"Laskagomba",     unit:"0,5 kg/csomag", price:899 },
        { id:"shimei",         name:"Shimei fehér",   unit:"150 g/csomag", price:520 },
        { id:"shimeibarna",    name:"Shimei barna",   unit:"150 g/csomag", price:520 },
        { id:"ordog",          name:"Ördögszekér gomba", unit:"2 kg/csomag", price:4600 },
        { id:"shitake",        name:"Shiitake gomba", unit:"0,5 kg/csomag", price:4500 }
      ]}
    ]
  },
  {
    id: "gyumolcs", label: "Gyümölcsök",
    groups: [
      { label: "Almafélék", items: [
        { id:"gala",   name:"Alma apró/iskolás", unit:"kg", price:350 },
        { id:"golden", name:"Alma Golden",       unit:"kg", price:450 },
        { id:"grany",  name:"Alma Grany Smith",  unit:"kg", price:990 },
        { id:"ida",    name:"Alma Idared",       unit:"kg", price:420 }
      ]},
      { label: "Citrusfélék", items: [
        { id:"citrom",      name:"Citrom",     unit:"kg", price:1100 },
        { id:"grapefruit",  name:"Grapefruit", unit:"kg", price:950 },
        { id:"lime",        name:"Lime",       unit:"kg", price:1550 },
        { id:"mandi",       name:"Mandarin",   unit:"kg", price:910 },
        { id:"nari",        name:"Narancs",    unit:"kg", price:550 }
      ]},
      { label: "Bogyósok", items: [
        { id:"afonya",  name:"Áfonya",  unit:"125g/doboz", price:650 },
        { id:"eper",    name:"Eper",    unit:"kg", price:0 },
        { id:"malna",   name:"Málna",   unit:"125g/doboz", price:1690 },
        { id:"ribizli", name:"Ribizli", unit:"125g/doboz", price:1990 }
      ]},
      { label: "Dinnyék", items: [
        { id:"gorogd",  name:"Görög dinnye", unit:"kg", price:320 },
        { id:"sargadi", name:"Sárgadinnye",  unit:"kg", price:420 }
      ]},
      { label: "Trópusi gyümölcsök", items: [
        { id:"ana",        name:"Ananász", unit:"db", price:650 },
        { id:"avo",        name:"Avokádó", unit:"db", price:700 },
        { id:"hassavo",    name:"Avokádó Haas (konyhakész)", unit:"db", price:525 },
        { id:"banan",      name:"Banán",   unit:"kg", price:590 },
        { id:"kiwi",       name:"Kiwi",    unit:"kg", price:1580 },
        { id:"passion",    name:"Passion Fruit", unit:"kg", price:12500 },
        { id:"mangó",      name:"Mangó",   unit:"db", price:775 },
        { id:"karambola",  name:"Karambola", unit:"db", price:1090 }
      ]},
      { label: "Egyéb gyümölcsök", items: [
        { id:"granat", name:"Gránátalma", unit:"db", price:750 },
        { id:"korte",  name:"Körte",     unit:"kg", price:850 },
        { id:"neki",   name:"Nektarin",  unit:"kg", price:750 },
        { id:"oszi",   name:"Őszibarack",unit:"kg", price:750 },
        { id:"sargab", name:"Sárgabarack",unit:"kg", price:740 },
        { id:"szolo",  name:"Szőlő",     unit:"kg", price:1700 },
        { id:"szilva", name:"Szilva",    unit:"kg", price:1490 }
      ]}
    ]
  },
  {
    id: "fuszer", label: "Fűszerek, csírák",
    groups: [
      { label: "Csírák", items: [
        { id:"retekcsira",  name:"Retek csíra",       unit:"doboz", price:990 },
        { id:"hagymacsira", name:"Hagyma csíra",      unit:"doboz", price:1100 },
        { id:"borsocsira",  name:"Borsó hajtás csíra",unit:"doboz", price:1300 }
      ]},
      { label: "Friss fűszerek", items: [
        { id:"bazsi",   name:"Bazsalikom",          unit:"köteg", price:750 },
        { id:"gyombi",  name:"Gyömbér",             unit:"kg", price:1790 },
        { id:"kakukk",  name:"Kakukkfű",            unit:"köteg", price:950 },
        { id:"kapor",   name:"Kapor",               unit:"köteg", price:690 },
        { id:"kori",    name:"Koriander",           unit:"köteg", price:690 },
        { id:"menta",   name:"Menta",               unit:"köteg", price:690 },
        { id:"peti",    name:"Petrezselyem zöldje", unit:"köteg", price:450 },
        { id:"rozi",    name:"Rozmaring",           unit:"köteg", price:890 },
        { id:"snid",    name:"Snidling",            unit:"köteg", price:990 },
        { id:"takony",  name:"Tárkony",             unit:"köteg", price:990 },
        { id:"turbi",   name:"Turbolya",            unit:"köteg", price:990 },
        { id:"zsalya",  name:"Zsálya",              unit:"köteg", price:990 }
      ]}
    ]
  },
  {
    id: "savanyu", label: "Savanyúságok",
    groups: [
      { label: "Paprikák", items: [
        { id:"simalmapap", name:"Almapaprika",         options:[{label:"5 kg",price:5340},{label:"10 kg",price:9490}] },
        { id:"almapap",    name:"Töltött almapaprika", options:[{label:"5 kg",price:0},{label:"10 kg",price:0}] },
        { id:"toltottpap", name:"Töltött paprika",     options:[{label:"5 kg",price:0},{label:"10 kg",price:0}] }
      ]},
      { label: "Uborkák", items: [
        { id:"csem", name:"Csemege uborka", options:[{label:"5 kg",price:5340},{label:"10 kg",price:9490}] },
        { id:"kovi", name:"Kovászos uborka",options:[{label:"5 kg",price:5340},{label:"10 kg",price:9490}] }
      ]},
      { label: "Káposztafélék", items: [
        { id:"csala",  name:"Csalamádé",        options:[{label:"5 kg",price:3790},{label:"15 kg",price:8900}] },
        { id:"savkap", name:"Savanyú Káposzta", options:[{label:"1 kg",price:670},{label:"5 kg",price:3300},{label:"17 kg",price:9200}] }
      ]},
      { label: "Egyéb", items: [
        { id:"cekla-s", name:"Cékla",        options:[{label:"5 kg",price:5340},{label:"15 kg",price:16020}] },
        { id:"gyongy",  name:"Gyöngyhagyma", options:[{label:"5 kg",price:9000},{label:"10 kg",price:16000}] }
      ]}
    ]
  },
  {
    id: "salatak", label: "Saláták",
    groups: [
      { label: "Saláták", items: [
        { id:"jegsalata",  name:"Jégsaláta",        unit:"db", price:450 },
        { id:"fejes",      name:"Fejes saláta",     unit:"db", price:260 },
        { id:"lollo",      name:"Lollo saláta zöld",unit:"db", price:450 },
        { id:"madar",      name:"Madársaláta",      unit:"doboz", price:590 },
        { id:"rukkola",    name:"Rukkola",          unit:"doboz", price:500 },
        { id:"ceklalevél", name:"Céklalevél",       unit:"doboz", price:500 },
        { id:"mix",        name:"Mix saláta",       unit:"doboz", price:500 },
        { id:"bebispenot", name:"Bébi spenót",      unit:"doboz", price:500 },
        { id:"romai",      name:"Római saláta",     unit:"db", price:1490 },
        { id:"bebiromai",  name:"Bébi római saláta",unit:"csomag", price:1290 },
        { id:"radicchio",  name:"Radicchio",        unit:"kg", price:2290 },
        { id:"edeskomeny", name:"Édeskömény",       unit:"db", price:970 }
      ]}
    ]
  },
  {
    id: "tisztitott", label: "Tisztított zöldségek",
    groups: [
      { label: "Burgonya", items: [
        { id:"t-burgonya-egesz",  name:"Burgonya Egész", unit:"kg", price:410 },
        { id:"t-burgonya-karika", name:"Burgonya Karika",unit:"kg", price:410 },
        { id:"t-burgonya-hasab",  name:"Burgonya Hasáb", unit:"kg", price:410 },
        { id:"t-burgonya-kocka",  name:"Burgonya Kocka", unit:"kg", price:410 },
        { id:"t-burgonya-parazs", name:"Burgonya Parázs",unit:"kg", price:360 }
      ]},
      { label: "Káposztafélék", items: [
        { id:"t-fejeskaposzta-reszelt", name:"Fejeskáposzta Reszelt",unit:"kg", price:390 },
        { id:"t-fejeskaposzta-csik",    name:"Fejeskáposzta Csík",   unit:"kg", price:390 },
        { id:"t-kelkaposzta-csik",      name:"Kelkáposzta Csík",     unit:"kg", price:390 },
        { id:"t-lilakaposzta-csik",     name:"Lilakáposzta Csík",    unit:"kg", price:390 }
      ]},
      { label: "Gyökérzöldségek", items: [
        { id:"t-zeller-egesz",        name:"Zeller Egész",        unit:"kg", price:570 },
        { id:"t-karalabe-egesz",      name:"Karalábé Egész",      unit:"kg", price:595 },
        { id:"t-repa-egesz",          name:"Répa Egész",          unit:"kg", price:570 },
        { id:"t-repa-karika",         name:"Répa Karika",         unit:"kg", price:570 },
        { id:"t-petrezselyem-egesz",  name:"Petrezselyem Egész",  unit:"kg", price:950 },
        { id:"t-petrezselyem-karika", name:"Petrezselyem Karika", unit:"kg", price:950 },
        { id:"t-petrezselyem-kocka",  name:"Petrezselyem Kocka",  unit:"kg", price:950 }
      ]},
      { label: "Hagymafélék", items: [
        { id:"t-voroshagyma-egesz",  name:"Vöröshagyma Egész",  unit:"kg", price:450 },
        { id:"t-voroshagyma-karika", name:"Vöröshagyma Karika", unit:"kg", price:450 },
        { id:"t-lilahagyma-egesz",   name:"Lilahagyma Egész",   unit:"kg", price:550 },
        { id:"t-lilahagyma-karika",  name:"Lilahagyma Karika",  unit:"kg", price:550 },
        { id:"t-foki",               name:"Fokhagyma tisztított",unit:"kg", price:2190 }
      ]}
    ]
  },
  {
    id: "tojas", label: "Tojás",
    groups: [
      { label: "Tojások", items: [
        { id:"talcas",  name:"Friss tálcás tojás M-es",  unit:"db", price:69, minQty:30, qtyStep:30 },
        { id:"dobozos", name:"Friss dobozos tojás M-es", unit:"db", price:690 },
        { id:"furj",    name:"Fürj tojás 24db",          unit:"csomag", price:1400 }
      ]}
    ]
  },
  {
    id: "szarazaru", label: "Szárazáru",
    groups: [
      { label: "Magvak, aromák", items: [
        { id:"diobel",     name:"Dióbél",             unit:"kg", price:3700 },
        { id:"daaltdio",   name:"Darált dió",         unit:"kg", price:3700 },
        { id:"mak",        name:"Darált mák 200g",    unit:"csomag", price:3200 },
        { id:"bulgur",     name:"Bulgur",             options:[{label:"500g",price:480},{label:"5 kg",price:3000}] },
        { id:"tarkabab",   name:"Tarkabab",           options:[{label:"500g",price:480},{label:"5 kg",price:3000}] },
        { id:"lencse",     name:"Lencse",             options:[{label:"500g",price:480},{label:"5 kg",price:3000}] }
      ]}
    ]
  }
];

// ÁFA kulcs kategóriánként: alapesetben 27%, a tojás termékeknél 5%.
// (Ugyanaz a logika, mint a kliens oldalon.)
function getVatRate(catId) {
  return catId === "tojas" ? 5 : 27;
}

// Egy termék megkeresése azonosító alapján, a kategória-azonosítójával együtt.
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
