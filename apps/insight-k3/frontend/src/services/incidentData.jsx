export const incidentData = {


monthly:[

{
month:"Jan",
incident:3
},

{
month:"Feb",
incident:5
},

{
month:"Mar",
incident:2
},

{
month:"Apr",
incident:6
},

{
month:"May",
incident:4
},

{
month:"Jun",
incident:1
}

],




cause:[


{
name:"Unsafe Action",
value:8
},

{
name:"Equipment Failure",
value:5
},

{
name:"Poor Housekeeping",
value:3
},

{
name:"PPE Violation",
value:2
},

{
name:"Weather",
value:2
}

],




location:[


{
name:"Harvesting Area",
value:7
},

{
name:"Workshop",
value:5
},

{
name:"Road Transport",
value:4
},

{
name:"Nursery",
value:3
},

{
name:"Office",
value:2
}

],





incidents:[


{
id:"INC-001",

date:"12 July 2026",

category:"Lost Time Injury",

location:"Harvesting Area",

department:"Harvesting",

severity:"High",

status:"Investigation",

description:
"Operator mengalami cedera akibat tertimpa cabang pohon saat aktivitas penebangan.",

investigation:null

},




{
id:"INC-002",

date:"10 July 2026",

category:"Vehicle Accident",

location:"Road Transport",

department:"Transport",

severity:"Medium",

status:"Corrective Action",

description:
"Kendaraan operasional mengalami kecelakaan ringan akibat kondisi jalan licin.",

investigation:null

},





{
id:"INC-003",

date:"08 July 2026",

category:"Near Miss",

location:"Workshop",

department:"Maintenance",

severity:"Low",

status:"Closed",

description:
"Ditemukan kondisi hampir celaka akibat alat kerja tidak tersimpan sesuai prosedur.",



investigation:{


timeline:[

{
step:"Incident Occurred",
date:"08 July 2026 09:15"
},

{
step:"Reported",
date:"08 July 2026 09:30"
},

{
step:"Investigation Started",
date:"08 July 2026 13:00"
},

{
step:"Corrective Action",
date:"09 July 2026"
},

{
step:"Closed",
date:"10 July 2026"
}

],



immediateCause:
"Penyimpanan alat kerja tidak sesuai standar housekeeping.",


rootCause:
"Kurangnya pengawasan penerapan prosedur 5R/5S area kerja.",


contributingFactor:
"Monitoring area kerja belum dilakukan secara konsisten.",



fiveWhy:[

{
question:"Mengapa terjadi near miss?",
answer:"Karena alat kerja berada pada jalur akses pekerja."
},

{
question:"Mengapa alat berada pada jalur akses?",
answer:"Karena alat tidak dikembalikan setelah digunakan."
},

{
question:"Mengapa alat tidak dikembalikan?",
answer:"Kontrol housekeeping belum berjalan optimal."
}

],



correctiveAction:[

{
action:"Melakukan penataan ulang area workshop",
pic:"Supervisor Maintenance",
status:"Completed"
},


{
action:"Melakukan safety briefing",
pic:"HSE Officer",
status:"Completed"
}

],



preventiveAction:[

"Melakukan inspeksi housekeeping mingguan",

"Meningkatkan safety awareness pekerja"

],



investigator:"HSE Department",

closingDate:"10 July 2026"


}

},





{
id:"INC-004",

date:"05 July 2026",

category:"Fire Incident",

location:"Plantation Area",

department:"Field Operation",

severity:"High",

status:"Investigation",

description:
"Terjadi kebakaran kecil pada area tanaman akibat sumber api tidak terkendali.",

investigation:null

},





{
id:"INC-005",

date:"01 July 2026",

category:"PPE Violation",

location:"Harvesting Area",

department:"Field Operation",

severity:"Medium",

status:"Closed",

description:
"Pekerja ditemukan tidak menggunakan alat pelindung diri lengkap saat bekerja.",



investigation:{


immediateCause:
"Ketidakpatuhan pekerja terhadap penggunaan APD.",


rootCause:
"Kurangnya disiplin penerapan prosedur keselamatan kerja.",


correctiveAction:[

{
action:"Memberikan safety briefing penggunaan APD",
pic:"HSE Officer",
status:"Completed"
}

],


investigator:"HSE Department",

closingDate:"03 July 2026"

}

},





{
id:"INC-006",

date:"28 June 2026",

category:"Equipment Failure",

location:"Workshop",

department:"Maintenance",

severity:"High",

status:"Repair",

description:
"Kerusakan alat berat menyebabkan penghentian sementara aktivitas produksi.",

investigation:null

}


]


};