"""Build public/data/foods.json from the USDA FoodData Central SR Legacy bulk download
(public domain; data-raw/sr_legacy/, 2018-04 release). Each menu item is pinned to an
exact FDC id chosen by hand so that the match is the right food (keyword search returned
wrong matches, e.g. puff pastry for "flour tortilla"). Run from lab/: python scripts/build_foods.py
"""
import csv
import json

D = "data-raw/sr_legacy/FoodData_Central_sr_legacy_food_csv_2018-04/"
# name, fdc_id, approximate serving (g), meal slot
MENU = [
    ("Scrambled eggs", 172187, 100, "breakfast"),
    ("Oatmeal", 173905, 240, "breakfast"),
    ("Flour tortilla", 167535, 45, "any"),
    ("Macaroni and cheese", 173325, 200, "main"),
    ("Shrimp cocktail", 175180, 85, "main"),
    ("Beef brisket", 169440, 100, "main"),
    ("Grilled chicken", 171477, 100, "main"),
    ("Tuna", 173709, 85, "main"),
    ("White rice", 168878, 160, "side"),
    ("Green beans", 169141, 125, "side"),
    ("Broccoli", 169967, 90, "side"),
    ("Dried apricots", 173941, 40, "snack"),
    ("Granola bar", 167542, 25, "snack"),
    ("Vanilla pudding", 169608, 113, "snack"),
    ("Peanut butter", 172470, 32, "any"),
    ("Cheese spread", 171254, 30, "any"),
    ("Orange juice", 169100, 240, "drink"),
    ("Coffee", 171890, 240, "drink"),
    ("Milk, from powder", 170877, 25, "drink"),
]
NUTR = {"kcal": "1008", "protein_g": "1003", "calcium_mg": "1087", "sodium_mg": "1093", "vitamin_d_IU": "1110"}

desc = {r["fdc_id"]: r["description"] for r in csv.DictReader(open(D + "food.csv", encoding="utf-8"))}
want = {str(m[1]) for m in MENU}
vals = {}
for r in csv.DictReader(open(D + "food_nutrient.csv", encoding="utf-8")):
    if r["fdc_id"] in want and r["nutrient_id"] in NUTR.values():
        vals[(r["fdc_id"], r["nutrient_id"])] = float(r["amount"])

foods = []
for name, fid, serving, slot in MENU:
    fid = str(fid)
    per100 = {k: vals.get((fid, nid), 0.0) for k, nid in NUTR.items()}
    foods.append({"name": name, "slot": slot, "serving_g": serving, "fdcId": int(fid), "usda_description": desc[fid], "per100": per100})
    print(f"{name:<20} {fid}  {desc[fid][:60]:<60} {per100}")

json.dump({
    "source": "USDA FoodData Central, SR Legacy release 2018-04 (fdc.nal.usda.gov), public domain.",
    "note": "Nutrients per 100 g as published. Serving sizes are approximate and chosen by us. These are Earth versions of foods similar to station menu items, not the actual space-food formulations.",
    "foods": foods,
}, open("public/data/foods.json", "w"), indent=1)
print("saved", len(foods))
