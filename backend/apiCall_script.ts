//make the call to the api
const urlEndpoint = "https://api.fda.gov/drug/event.json?api_key=8zAOfLqeChggb3QqJuyEEl9ggt4xv0SCYBiuJkqg&limit=10"
const fetchData = async () => {
  try {
    const response = await fetch(urlEndpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Data fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const data = fetchData();

//sponsor name -> nome da empresa
//products -> produtos dessa empresa -> array de produtos dessa empresa contendo:
//brand_name -> nome comercial
//product_number -> número do produto
//active_ingredients -> array de ingredientes ativos ->  . name -> nome do ingrediente ativo
//dosage_form -> forma de aplicação
//route -> via de administração
//drug name -> nome do medicamento
