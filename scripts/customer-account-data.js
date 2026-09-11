(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PaywizardCustomerAccountData = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  // Shared prototype account/terminal directory, originally used by Customer Alerts.
  function createHierarchy() {
  const monitoringHierarchy = [
    {
      "id": "sp-universal",
      "name": "Universal Processing",
      "agents": [
        {
          "id": "mock-agt-003",
          "name": "Boston Partner Group",
          "merchants": [
            {
              "id": "mock-mch-026",
              "name": "Birch Bakery East",
              "stores": [
                {
                  "id": "mock-str-028",
                  "name": "University 28",
                  "terminals": []
                }
              ]
            }
          ]
        },
        {
          "id": "mock-agt-004",
          "name": "Manhattan Merchant Agency",
          "merchants": [
            {
              "id": "mock-mch-027",
              "name": "Seabright Foods East",
              "stores": [
                {
                  "id": "mock-str-029",
                  "name": "Park Avenue 29",
                  "terminals": []
                }
              ]
            }
          ]
        },
        {
          "id": "mock-agt-005",
          "name": "Hudson Retail Partners",
          "merchants": [
            {
              "id": "mock-mch-016",
              "name": "Elm Convenience",
              "stores": [
                {
                  "id": "mock-str-030",
                  "name": "Southbank 30",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-017",
              "name": "Beacon Cafe",
              "stores": [
                {
                  "id": "mock-str-031",
                  "name": "Downtown 31",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-018",
              "name": "Pinecrest Retail",
              "stores": [
                {
                  "id": "mock-str-032",
                  "name": "Riverside 32",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-019",
              "name": "Saffron Kitchen",
              "stores": [
                {
                  "id": "mock-str-033",
                  "name": "Central Station 33",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-020",
              "name": "Aster Market",
              "stores": [
                {
                  "id": "mock-str-034",
                  "name": "Airport 34",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-021",
              "name": "Harbor Market East",
              "stores": [
                {
                  "id": "mock-str-035",
                  "name": "West End 35",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-022",
              "name": "Cedar Coffee East",
              "stores": [
                {
                  "id": "mock-str-036",
                  "name": "Old Town 36",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-023",
              "name": "Northstar Retail East",
              "stores": [
                {
                  "id": "mock-str-037",
                  "name": "Northgate 37",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-024",
              "name": "Willow Grocers East",
              "stores": [
                {
                  "id": "mock-str-038",
                  "name": "Marina 38",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-025",
              "name": "Atlas Vending East",
              "stores": [
                {
                  "id": "mock-str-039",
                  "name": "Market Square 39",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-028",
              "name": "Oak & Bean East",
              "stores": [
                {
                  "id": "mock-str-040",
                  "name": "University 40",
                  "terminals": []
                }
              ]
            }
          ]
        },
        {
          "id": "mock-agt-006",
          "name": "Brooklyn Commerce Agency",
          "merchants": [
            {
              "id": "mock-mch-029",
              "name": "Juniper Stores East",
              "stores": [
                {
                  "id": "mock-str-041",
                  "name": "Park Avenue 41",
                  "terminals": []
                }
              ]
            }
          ]
        },
        {
          "id": "mock-agt-007",
          "name": "Queens Payment Partners",
          "merchants": [
            {
              "id": "mock-mch-030",
              "name": "Metro Pantry East",
              "stores": [
                {
                  "id": "mock-str-042",
                  "name": "Southbank 42",
                  "terminals": []
                }
              ]
            }
          ]
        },
        {
          "id": "mock-agt-008",
          "name": "Jersey Merchant Services",
          "merchants": [
            {
              "id": "mock-mch-031",
              "name": "Elm Convenience East",
              "stores": [
                {
                  "id": "mock-str-043",
                  "name": "Downtown 43",
                  "terminals": []
                }
              ]
            }
          ]
        },
        {
          "id": "mock-agt-009",
          "name": "Long Island Retail Agency",
          "merchants": [
            {
              "id": "mock-mch-032",
              "name": "Beacon Cafe East",
              "stores": [
                {
                  "id": "mock-str-044",
                  "name": "Riverside 44",
                  "terminals": []
                }
              ]
            }
          ]
        },
        {
          "id": "mock-agt-010",
          "name": "New England Partners",
          "merchants": [
            {
              "id": "mock-mch-033",
              "name": "Pinecrest Retail East",
              "stores": [
                {
                  "id": "mock-str-045",
                  "name": "Central Station 45",
                  "terminals": []
                }
              ]
            }
          ]
        }
      ],
      "merchants": [
        {
          "id": "merchant-kind-world",
          "name": "1 of a Kind World Travel LLC",
          "stores": [
            {
              "id": "s-midtown",
              "name": "Midtown Store",
              "terminals": [
                {
                  "id": "WP6267UQ36002376",
                  "name": "Terminal - WP6267UQ36002376",
                  "temperature": [
                    "temperature_range",
                    "refrigeration_fault"
                  ]
                },
                {
                  "id": "NYC-Q3-0042",
                  "name": "Lobby Vending Q3",
                  "temperature": []
                },
                {
                  "id": "NYC-Q3-0043",
                  "name": "Breakroom Cooler Q3",
                  "temperature": [
                    "temperature_range"
                  ]
                }
              ]
            },
            {
              "id": "s-boston",
              "name": "Boston Office",
              "terminals": [
                {
                  "id": "BOS-Q3-0018",
                  "name": "Cafeteria Q3",
                  "temperature": [
                    "temperature_range",
                    "refrigeration_fault"
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "mock-mch-006",
          "name": "Harbor Market",
          "stores": [
            {
              "id": "mock-str-007",
              "name": "Downtown",
              "terminals": []
            },
            {
              "id": "mock-str-008",
              "name": "Riverside",
              "terminals": []
            },
            {
              "id": "mock-str-009",
              "name": "Central Station",
              "terminals": []
            },
            {
              "id": "mock-str-010",
              "name": "Airport",
              "terminals": []
            },
            {
              "id": "mock-str-011",
              "name": "West End",
              "terminals": []
            },
            {
              "id": "mock-str-012",
              "name": "Old Town",
              "terminals": []
            },
            {
              "id": "mock-str-013",
              "name": "Northgate",
              "terminals": []
            },
            {
              "id": "mock-str-014",
              "name": "Marina",
              "terminals": []
            },
            {
              "id": "mock-str-015",
              "name": "Market Square",
              "terminals": []
            },
            {
              "id": "mock-str-016",
              "name": "University",
              "terminals": []
            },
            {
              "id": "mock-str-017",
              "name": "Park Avenue",
              "terminals": []
            },
            {
              "id": "mock-str-018",
              "name": "Southbank",
              "terminals": []
            },
            {
              "id": "mock-str-067",
              "name": "Downtown 67",
              "terminals": []
            }
          ]
        },
        {
          "id": "mock-mch-007",
          "name": "Cedar Coffee",
          "stores": [
            {
              "id": "mock-str-019",
              "name": "Downtown 19",
              "terminals": []
            },
            {
              "id": "mock-str-068",
              "name": "Riverside 68",
              "terminals": []
            }
          ]
        },
        {
          "id": "mock-mch-008",
          "name": "Northstar Retail",
          "stores": [
            {
              "id": "mock-str-020",
              "name": "Riverside 20",
              "terminals": []
            },
            {
              "id": "mock-str-069",
              "name": "Central Station 69",
              "terminals": []
            }
          ]
        },
        {
          "id": "mock-mch-009",
          "name": "Willow Grocers",
          "stores": [
            {
              "id": "mock-str-021",
              "name": "Central Station 21",
              "terminals": []
            },
            {
              "id": "mock-str-070",
              "name": "Airport 70",
              "terminals": []
            }
          ]
        },
        {
          "id": "mock-mch-010",
          "name": "Atlas Vending",
          "stores": [
            {
              "id": "mock-str-022",
              "name": "Airport 22",
              "terminals": []
            }
          ]
        },
        {
          "id": "mock-mch-011",
          "name": "Birch Bakery",
          "stores": [
            {
              "id": "mock-str-023",
              "name": "West End 23",
              "terminals": []
            }
          ]
        },
        {
          "id": "mock-mch-012",
          "name": "Seabright Foods",
          "stores": [
            {
              "id": "mock-str-024",
              "name": "Old Town 24",
              "terminals": []
            }
          ]
        },
        {
          "id": "mock-mch-013",
          "name": "Oak & Bean",
          "stores": [
            {
              "id": "mock-str-025",
              "name": "Northgate 25",
              "terminals": []
            }
          ]
        },
        {
          "id": "mock-mch-014",
          "name": "Juniper Stores",
          "stores": [
            {
              "id": "mock-str-026",
              "name": "Marina 26",
              "terminals": []
            }
          ]
        },
        {
          "id": "mock-mch-015",
          "name": "Metro Pantry",
          "stores": [
            {
              "id": "mock-str-027",
              "name": "Market Square 27",
              "terminals": []
            }
          ]
        }
      ]
    },
    {
      "id": "sp-eu-direct",
      "name": "Europe Direct",
      "agents": [],
      "merchants": [
        {
          "id": "demo-cafe-berlin",
          "name": "Demo Cafe Berlin",
          "stores": [
            {
              "id": "berlin-mitte",
              "name": "Berlin Mitte",
              "terminals": [
                {
                  "id": "WP44907Q33200398",
                  "name": "Retail shop T1",
                  "temperature": [
                    "temperature_range",
                    "refrigeration_fault"
                  ]
                },
                {
                  "id": "WP44907Q33200412",
                  "name": "Retail shop T2",
                  "temperature": [
                    "temperature_range"
                  ]
                }
              ]
            },
            {
              "id": "mock-str-046",
              "name": "Airport 46",
              "terminals": []
            }
          ]
        }
      ]
    },
    {
      "id": "sp-north-america",
      "name": "North America Ops",
      "agents": [
        {
          "id": "agent-seattle",
          "name": "Seattle Field Agent",
          "merchants": [
            {
              "id": "seattle-central",
              "name": "Seattle Central",
              "stores": [
                {
                  "id": "ev-charger-hub",
                  "name": "EV Charger Hub",
                  "terminals": [
                    {
                      "id": "WP7300EV33001088",
                      "name": "EV Charger Bay 07",
                      "temperature": [
                        "temperature_range",
                        "refrigeration_fault"
                      ]
                    }
                  ]
                },
                {
                  "id": "mock-str-047",
                  "name": "West End 47",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-034",
              "name": "Saffron Kitchen East",
              "stores": [
                {
                  "id": "mock-str-048",
                  "name": "Old Town 48",
                  "terminals": []
                }
              ]
            }
          ]
        },
        {
          "id": "agent-waou",
          "name": "Waou Distribution",
          "merchants": [
            {
              "id": "waou-terminal",
              "name": "Waou Terminal",
              "stores": [
                {
                  "id": "waou-main",
                  "name": "Waou Main Store",
                  "terminals": [
                    {
                      "id": "WP52205Q33000977",
                      "name": "Waou Terminal 01",
                      "temperature": [
                        "temperature_range",
                        "refrigeration_fault"
                      ]
                    },
                    {
                      "id": "WP52205Q33000981",
                      "name": "Waou Terminal 05",
                      "temperature": []
                    }
                  ]
                },
                {
                  "id": "mock-str-049",
                  "name": "Northgate 49",
                  "terminals": []
                }
              ]
            },
            {
              "id": "mock-mch-035",
              "name": "Aster Market East",
              "stores": [
                {
                  "id": "mock-str-050",
                  "name": "Marina 50",
                  "terminals": []
                }
              ]
            }
          ]
        }
      ],
      "merchants": []
    },
    {
      "id": "sp-poland",
      "name": "Poland Service Hub",
      "agents": [],
      "merchants": [
        {
          "id": "cartpoland-01",
          "name": "CARTPOLAND-01",
          "stores": [
            {
              "id": "warsaw-vending",
              "name": "Warsaw Vending Area",
              "terminals": [
                {
                  "id": "WP2013Q321000014",
                  "name": "Vending Machine 04",
                  "temperature": []
                },
                {
                  "id": "WP2013Q321000018",
                  "name": "Vending Machine 08",
                  "temperature": [
                    "temperature_range"
                  ]
                }
              ]
            },
            {
              "id": "mock-str-051",
              "name": "Market Square 51",
              "terminals": []
            }
          ]
        }
      ]
    },
    {
      "id": "mock-sp-005",
      "name": "Atlantic Payment Services",
      "agents": [
        {
          "id": "mock-agt-011",
          "name": "Bay Area Agency",
          "merchants": [
            {
              "id": "mock-mch-036",
              "name": "Harbor Market West",
              "stores": [
                {
                  "id": "mock-str-052",
                  "name": "University 52",
                  "terminals": []
                }
              ]
            }
          ]
        }
      ],
      "merchants": []
    },
    {
      "id": "mock-sp-006",
      "name": "Pacific Commerce Network",
      "agents": [
        {
          "id": "mock-agt-012",
          "name": "Portland Merchant Partners",
          "merchants": [
            {
              "id": "mock-mch-037",
              "name": "Cedar Coffee West",
              "stores": [
                {
                  "id": "mock-str-053",
                  "name": "Park Avenue 53",
                  "terminals": []
                }
              ]
            }
          ]
        }
      ],
      "merchants": []
    },
    {
      "id": "mock-sp-007",
      "name": "Alpine Payments",
      "agents": [
        {
          "id": "mock-agt-013",
          "name": "Denver Commerce Agency",
          "merchants": [
            {
              "id": "mock-mch-038",
              "name": "Northstar Retail West",
              "stores": [
                {
                  "id": "mock-str-054",
                  "name": "Southbank 54",
                  "terminals": []
                }
              ]
            }
          ]
        }
      ],
      "merchants": []
    },
    {
      "id": "mock-sp-008",
      "name": "Nordic Merchant Services",
      "agents": [
        {
          "id": "mock-agt-014",
          "name": "Austin Payment Partners",
          "merchants": [
            {
              "id": "mock-mch-039",
              "name": "Willow Grocers West",
              "stores": [
                {
                  "id": "mock-str-055",
                  "name": "Downtown 55",
                  "terminals": []
                }
              ]
            }
          ]
        }
      ],
      "merchants": []
    },
    {
      "id": "mock-sp-009",
      "name": "Iberia Payment Solutions",
      "agents": [
        {
          "id": "mock-agt-015",
          "name": "London Retail Partners",
          "merchants": [
            {
              "id": "mock-mch-040",
              "name": "Atlas Vending West",
              "stores": [
                {
                  "id": "mock-str-056",
                  "name": "Riverside 56",
                  "terminals": []
                }
              ]
            }
          ]
        }
      ],
      "merchants": []
    },
    {
      "id": "mock-sp-010",
      "name": "Benelux Commerce",
      "agents": [
        {
          "id": "mock-agt-016",
          "name": "Paris Merchant Agency",
          "merchants": [
            {
              "id": "mock-mch-041",
              "name": "Birch Bakery West",
              "stores": [
                {
                  "id": "mock-str-057",
                  "name": "Central Station 57",
                  "terminals": []
                }
              ]
            }
          ]
        }
      ],
      "merchants": []
    },
    {
      "id": "mock-sp-011",
      "name": "Adriatic Processing",
      "agents": [
        {
          "id": "mock-agt-017",
          "name": "Munich Commerce Partners",
          "merchants": [
            {
              "id": "mock-mch-042",
              "name": "Seabright Foods West",
              "stores": [
                {
                  "id": "mock-str-058",
                  "name": "Airport 58",
                  "terminals": []
                }
              ]
            }
          ]
        }
      ],
      "merchants": []
    },
    {
      "id": "mock-sp-012",
      "name": "Baltic Payment Hub",
      "agents": [
        {
          "id": "mock-agt-018",
          "name": "Madrid Retail Agency",
          "merchants": [
            {
              "id": "mock-mch-043",
              "name": "Oak & Bean West",
              "stores": [
                {
                  "id": "mock-str-059",
                  "name": "West End 59",
                  "terminals": []
                }
              ]
            }
          ]
        }
      ],
      "merchants": []
    },
    {
      "id": "mock-sp-013",
      "name": "Maple Commerce Services",
      "agents": [
        {
          "id": "mock-agt-019",
          "name": "Toronto Merchant Partners",
          "merchants": []
        }
      ],
      "merchants": []
    },
    {
      "id": "mock-sp-014",
      "name": "Southern Cross Payments",
      "agents": [
        {
          "id": "mock-agt-020",
          "name": "Sydney Retail Partners",
          "merchants": []
        }
      ],
      "merchants": [
        {
          "id": "mock-mch-044",
          "name": "Juniper Stores West",
          "stores": [
            {
              "id": "mock-str-060",
              "name": "Old Town 60",
              "terminals": []
            }
          ]
        }
      ]
    },
    {
      "id": "mock-sp-015",
      "name": "Sakura Merchant Network",
      "agents": [],
      "merchants": [
        {
          "id": "mock-mch-045",
          "name": "Metro Pantry West",
          "stores": [
            {
              "id": "mock-str-061",
              "name": "Northgate 61",
              "terminals": []
            }
          ]
        }
      ]
    },
    {
      "id": "mock-sp-016",
      "name": "Lion City Payments",
      "agents": [],
      "merchants": [
        {
          "id": "mock-mch-046",
          "name": "Elm Convenience West",
          "stores": [
            {
              "id": "mock-str-062",
              "name": "Marina 62",
              "terminals": []
            }
          ]
        }
      ]
    },
    {
      "id": "mock-sp-017",
      "name": "Harbor Payment Services",
      "agents": [],
      "merchants": [
        {
          "id": "mock-mch-047",
          "name": "Beacon Cafe West",
          "stores": [
            {
              "id": "mock-str-063",
              "name": "Market Square 63",
              "terminals": []
            }
          ]
        }
      ]
    },
    {
      "id": "mock-sp-018",
      "name": "Crescent Commerce",
      "agents": [],
      "merchants": [
        {
          "id": "mock-mch-048",
          "name": "Pinecrest Retail West",
          "stores": [
            {
              "id": "mock-str-064",
              "name": "University 64",
              "terminals": []
            }
          ]
        }
      ]
    },
    {
      "id": "mock-sp-019",
      "name": "Meridian Processing",
      "agents": [],
      "merchants": [
        {
          "id": "mock-mch-049",
          "name": "Saffron Kitchen West",
          "stores": [
            {
              "id": "mock-str-065",
              "name": "Park Avenue 65",
              "terminals": []
            }
          ]
        }
      ]
    },
    {
      "id": "mock-sp-020",
      "name": "Summit Payment Network",
      "agents": [],
      "merchants": [
        {
          "id": "mock-mch-050",
          "name": "Aster Market West",
          "stores": [
            {
              "id": "mock-str-066",
              "name": "Southbank 66",
              "terminals": []
            }
          ]
        }
      ]
    }
  ];
  // Existing agents remain level-one accounts; the added branch exercises all three levels.
  monitoringHierarchy.forEach(provider => provider.agents.forEach(agent => { agent.parentId ||= ""; agent.level ||= 1; }));
  for (let level = 1; level <= 3; level++) {
    monitoringHierarchy[0].agents.push({ id: `demo-agent-l${level}`, name: `Demo Agent Level ${level}`, level, parentId: level === 1 ? "" : `demo-agent-l${level - 1}`, merchants: [{ id: `demo-merchant-l${level}`, name: `Demo Merchant Level ${level}`, stores: [{ id: `demo-store-l${level}`, name: `Demo Store Level ${level}`, terminals: [{ id: `DEMO-AGT${level}-001`, name: `Demo Terminal Level ${level}`, temperature: ["temperature_range", "refrigeration_fault"] }] }] }] });
  }
  return monitoringHierarchy;
  }
  return { createHierarchy };
});
