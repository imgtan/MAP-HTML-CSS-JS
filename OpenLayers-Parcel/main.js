//global olarak tanımlama
var wkt = new ol.format.WKT();
var feature, deleteID, editedWKT, WktString, editedId;
var arrayList = [];
//hazır kod map için
const raster = new ol.layer.Tile({
  source: new ol.source.OSM(),
});

const source = new ol.source.Vector();
const vector = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: "rgba(255, 255, 255, 0.2)",
    }),
    stroke: new ol.style.Stroke({
      color: "#ffcc33",
      width: 2,
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: "#ffcc33",
      }),
    }),
  }),
});

// Limit multi-world panning to one world east and west of the real world.
// Geometry coordinates have to be within that range.
const extent = ol.proj.get("EPSG:3857").getExtent().slice();
extent[0] += extent[0];
extent[2] += extent[2];
const map = new ol.Map({
  layers: [raster, vector],
  target: "map",
  view: new ol.View({
    center: [-11000000, 4600000],
    zoom: 4,
    extent,
    projection: "EPSG:3857",
  }),
});

const modify = new ol.interaction.Modify({ source: source });
map.addInteraction(modify);

let draw, snap; // global so we can remove them later
const typeSelect = document.getElementById("type");

/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  map.removeInteraction(snap);
  addInteractions();
  map.un("click", edit);
};

function addInteractions() {
  draw = new ol.interaction.Draw({
    source: source,
    type: typeSelect.value,
  });
  map.addInteraction(draw);
  snap = new ol.interaction.Snap({ source: source });
  map.addInteraction(snap);
  draw.on("drawend", drawend); //çizim bittiğinde fonksiyona yönlendiriyor.
}
//---------------------------------bitiş---------------------------------//

function drawend(evt) {
  feature = evt.feature;
  //var x = feature.getGeometry().getCoordinates()
  WktString = wkt.writeFeature(feature);
  openModal();
}

function openModal() {
  //modal açar yeniden açıldığında ise bilgiler boş gelir
  modal.style.display = "block";
  documentSaveClear();
}

function closeModal() {
  //modalı kapar
  modal.style.display = "none";
  deleteLast(); //modal kapandığında last element silinir.
}

function closeEditedModal() {
  //edited modalı kapar
  editedModal.style.display = "none";
}

//addInteraction ile draw ve snap özellikleri eklenir
addInteractions();

function listele() {
  var t = source.getFeatures();
  console.log(t);
  arrayList = [];
  t.forEach((feature) => {

      var parcelid = feature.A.ParcelID
      var parcelCountry = feature.A.ParcelCountry
      var parcelCity = feature.A.ParcelCity
      var parcelDistrict = feature.A.ParcelDistrict
      var parcelwkt = feature.A.WktString

    var arrayList2 = [parcelid, parcelCountry, parcelCity, parcelDistrict, parcelwkt]

  arrayList.push(arrayList2)
  });
console.log(arrayList)
    $(document).ready(function () {
      $("#example").DataTable({
        destroy: true,
        data: arrayList,
        columns: [
          { title: "ID" },
          { title: "Ülke" },
          { title: "Şehir" },
          { title: "İlçe" },
          { title: "WKT" },
        ],
      });

    });
}

// modal oluşturuldu
var modal = document.getElementById("modal"); //parsel eklemek için modal
var editedModal = document.getElementById("editModal"); //editlemek için modal
var span = document.getElementsByClassName("close")[0];
var deleteSpan = document.getElementsByClassName("closeEditedModal")[0];

span.onclick = function () {
  documentSaveClear();
  var a = source.getFeatures();
  var b = a[a.length - 1];
  source.removeFeature(b);
  modal.style.display = "none";
};

deleteSpan.onclick = function () {
  documentEditClear();
  editedModal.style.display = "none";
};

function editParcel(feature) {
  deleteID = feature.A.ParcelID;
  document.getElementById("editedCountry").value = feature.A.ParcelCountry;
  document.getElementById("editedCity").value = feature.A.ParcelCity;
  document.getElementById("editedDistrict").value = feature.A.ParcelDistrict;
  editedWKT = feature.A.WktString;
  editedId = feature.A.ParcelID;
  editedModal.style.display = "block";
}

// Get the button that opens the modal //modeli açan buton oluşturulur id:button olan değiştir butonu
// //değiştir butonuna basınca modal açılır
// var btn = document.getElementById("button");
// btn.onclick = function() {
//   modal.style.display = "block"

// }

//harita ve modal dışında, ekrana tıklandığında modeli kapatır
window.onclick = function (event) {
  if (event.target == modal) {
    documentSaveClear();
    deleteLast();
    modal.style.display = "none";
    //modal kapandığında last element silinir.
  } else if (event.target == editedModal) {
    documentEditClear();
    editedModal.style.display = "none";
  }
};

function documentSaveClear() {
  document.getElementById("country").value = "";
  document.getElementById("city").value = "";
  document.getElementById("district").value = "";
}

function documentEditClear() {
  document.getElementById("editedCountry").value = " ";
  document.getElementById("editedCity").value = " ";
  document.getElementById("editedDistrict").value = " ";
}

function deleteLast() {
  //bilgi girilmeden çıkış yapıldığında noktalar silinir.
  var x = source.getFeatures();
  var y = x.length;
  y = x[y - 1];
  source.removeFeature(y);
}

//submit butonuna basınca çalışan fonksiyon ile girilen değerler veritabanına aktarılır
//listele butonuna basınca çalışan fonksiyon ile veritabanından veriler yazdırılır.
$(document).ready(function () {
  $("#submit").click(function () {
    modal.style.display = "none";
    let cnt = document.getElementById("country").value;
    let cty = document.getElementById("city").value;
    let dst = document.getElementById("district").value;
    var WktS = WktString;
    var jsonData = {
      parcelCountry: cnt,
      parcelCity: cty,
      parcelDistrict: dst,
      wktString: WktS,
    };
    console.log(jsonData);
    $.ajax({
      type: "post",
      url: "https://localhost:44361/api/ParcelModel/add",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(jsonData),
      success: successSave,
      dataType: "json",
    });
  }),
    $("#update").click(function () {
      editedModal.style.display = "none";
      let editedCountry = document.getElementById("editedCountry").value;
      let editedCity = document.getElementById("editedCity").value;
      let editedDistrict = document.getElementById("editedDistrict").value;
      var EditedJsonData = {
        parcelID: editedId,
        parcelCountry: editedCountry,
        parcelCity: editedCity,
        parcelDistrict: editedDistrict,
        wktString: editedWKT,
      };
      console.log(EditedJsonData);
      $.ajax({
        type: "post",
        url: "https://localhost:44361/api/ParcelModel/update",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(EditedJsonData),
        success: successUpdate,
        dataType: "json",
      });
      listele();
    }),
    $("#delete").click(function () {
      editedModal.style.display = "none";
      console.log("geldi", deleteID);
      var jsonData = {
        parcelID: deleteID,
      };
      $.ajax({
        type: "delete",
        url: "https://localhost:44361/api/ParcelModel/delete/",
        success: successDelete(deleteID),
        type: "post",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(jsonData),
        dataType: "json",
      });
    }),
    $("#listButton").click(function () {
      $.ajax({
        type: "get",
        url: "https://localhost:44361/api/ParcelModel/getall",
        success: list,
        dataType: "json",
      });
    }),
    $.ajax({
      type: "get",
      url: "https://localhost:44361/api/ParcelModel/getall",
      success: list,
      dataType: "json",
    });
  $("#editButton").click(function () {
    map.removeInteraction(draw);
    map.removeInteraction(snap);
    //map.removeInteraction(modify);
    //map.removeInteraction(event);
    document.getElementById("type").value = "Seçiniz";
    map.on("click", edit);
  });
});

// function error(e) {
//   console.log("error", e)
// }
function edit(e) {
  map.forEachFeatureAtPixel(e.pixel, function (feature) {
    editParcel(feature);
  });
}

modify.on("modifyend", function (mp) {
  console.log(mp);

  var feature = mp.features.getArray()[0];
  var featureProp = feature.getProperties();

  let mpId = featureProp.ParcelID;
  let mpCountry = featureProp.ParcelCountry;
  let mpCity = featureProp.ParcelCity;
  let mpDistrict = featureProp.ParcelDistrict;
  let mpWkt = wkt.writeFeature(feature, {
    dataProjection: "EPSG:3857",
    featureProjection: "EPSG:3857",
  });
  let wktEditJson = {
    parcelID: mpId,
    parcelCountry: mpCountry,
    parcelCity: mpCity,
    parcelDistrict: mpDistrict,
    wktString: mpWkt,
  };
  console.log(mpId, mpCountry, mpCity, mpDistrict, mpWkt);
  $.ajax({
    type: "post",
    url: "https://localhost:44361/api/ParcelModel/update",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(wktEditJson),
    success: successWktUpdate,
    dataType: "json",
  });
});

function list(l) {
  source.clear();

  l.forEach((feature) => {
    if(!feature.wktString){
      return 
    }
    const parcel = wkt.readFeature(feature.wktString, {
      dataProjection: "EPSG:3857",
      featureProjection: "EPSG:3857",
    });
    parcel.set("ParcelID", feature.parcelID);
    parcel.set("ParcelCountry", feature.parcelCountry);
    parcel.set("ParcelCity", feature.parcelCity);
    parcel.set("ParcelDistrict", feature.parcelDistrict);
    parcel.set("WktString", feature.wktString);
    source.addFeature(parcel);
  });

}

function successSave(e) {
  var array = source.getFeatures();
  var last = array[array.length - 1];
  last.set("ParcelID", e);
  last.set("ParcelCountry", document.getElementById("country").value);
  last.set("ParcelCity", document.getElementById("city").value);
  last.set("ParcelDistrict", document.getElementById("district").value);
  last.set("WktString", WktString);

  documentSaveClear();
  console.log("başarılı", e);
}

function successWktUpdate() {
  console.log("wkt güncelleme başarılı.");
}

function successUpdate(e) {
  var a = source.getFeatures();
  a.forEach((element) => {
    if (element.A.parcelID == e) {
      element.A.parcelCountry = document.getElementById("editedCountry").value;
      element.A.parcelCity = document.getElementById("editedCity").value;
      element.A.parcelDistrict = document.getElementById("editedDistrict").value;
      documentEditClear();
      console.log(
        element.A.parcelID,
        element.A.parcelCountry,
        element.A.parcelCity,
        element.A.parcelDistrict,
        element.A.wktString
      );
    }

  });
  console.log("güncelleme başarılı.");
}


function successDelete(x) {
  var array = source.getFeatures();
  array.forEach((e) => {
    if (e.A.ParcelID == x) {
      source.removeFeature(e);
    }
  });

  console.log("silme basarılı", x);
}

// function getInfo() //girilen bilgiler kaydedilir
// {
//   let cnt = document.getElementById("country").value;
//   let cty = document.getElementById("city").value;
//   let dst = document.getElementById("district").value;
//   console.log("Country: " + cnt + " City: " + cty + " Distirct: " + dst + " WKT: " + wktString)
//   modal.style.display = "none";
// }
