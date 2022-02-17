/**
 * I need a simple tool to take any POJO and turn it into a EnhancedNode.
 */
 const item = {
    was: {
      product: "Noidecs T10:C15 Cannabis Oil",
      form: "Full Spectrum Oil",
      strain: "Sativa",
      cultivar: "N/A",
      thc: "10 mg/ml",
      cbd: "15 mg/ml",
      size: "50ml",
      privateprescriptionpricingapprox: "50ml bottle from £175",
      availableonprojecttwenty21: "Yes",
      productsize: "50ml bottle",
      monthlyamountcappedat15: "upto 50ml",
      pharmacyt21: "Dispensary Green",
      notes: "",
      levelsinstockuk: "Out Of Stock",
      atpharmacy: "No",
      moreinformationreviews: null,
      dispensary: "dg",
    },
    now: {
      product: "Noidecs T10:C15 Cannabis Oil",
      // product: extendOut(['Product'], { NAME: "Noidecs T10:C15 Cannabis Oil" }),
  
      form: "Full Spectrum Oil",
      // form: OutboundRelationship(['HAS_FORM'], { labels: ['Product'], NAME: "Full Spectrum Oil" }),
  
      /* déjà vu 👾  */
      // form: OutboundRelationship({
      //   type: ['HAS_FORM'],
      //   // props: {},
      //   endNode: { labels: ['Product'], NAME: "Full Spectrum Oil" }
      // }),
  
      form: {
        rel: [
          ["HAS_FORM"], // type
          "outbound", // direction
          {}, // props
        ],
        endNode: [
          ["Product"], // labels
          { NAME: "Full Spectrum Oil" }, // required props
          {}, // optional props
        ],
      },
  
      strain: "Sativa",
      cultivar: "N/A",
      thc: "10 mg/ml",
      cbd: "15 mg/ml",
      size: "50ml",
      privateprescriptionpricingapprox: "50ml bottle from £175",
      availableonprojecttwenty21: "Yes",
      productsize: "50ml bottle",
      monthlyamountcappedat15: "upto 50ml",
      pharmacyt21: "Dispensary Green",
      notes: "",
      levelsinstockuk: "Out Of Stock",
      atpharmacy: "No",
      moreinformationreviews: null,
      dispensary: "dg",
    },
  };