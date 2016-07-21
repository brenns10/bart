"""
From the BART Fare Chart 2016:
https://www.bart.gov/sites/default/files/docs/2016%20Fare%20Chart.pdf
"""
import numpy as np

# Copy-pasted the triangular chart, comma separated them, and made lists:
_raw_fares = [
    [4.40],
    [7.65,3.20],
    [3.20,7.65,3.20],
    [3.20,3.20,7.95,3.75],
    [3.20,3.20,3.20,8.15,3.95],
    [3.05,3.20,3.20,3.65,8.40,4.15],
    [1.95,3.05,3.20,3.40,3.80,8.55,4.30],
    [1.95,1.95,3.05,3.35,3.65,4.05,8.80,4.55],
    [1.95,1.95,1.95,3.05,3.45,3.75,4.15,8.90,4.60],
    [1.95,1.95,1.95,1.95,3.25,3.60,3.90,4.30,8.95,4.65],
    [1.95,1.95,1.95,1.95,1.95,3.25,3.60,3.90,4.30,8.95,4.65],
    [1.95,1.95,1.95,1.95,1.95,1.95,3.25,3.60,3.90,4.30,8.95,4.65],
    [1.95,1.95,1.95,1.95,1.95,1.95,1.95,3.25,3.60,3.90,4.30,8.95,4.65],
    [3.20,3.20,3.20,3.20,3.45,3.55,3.80,3.95,4.15,4.10,4.30,4.55,9.15,4.90],
    [1.95,3.45,3.45,3.45,3.45,3.60,3.70,3.95,4.10,4.20,4.20,4.35,4.65,9.25,4.95],
    [1.95,1.95,3.45,3.45,3.45,3.45,3.60,3.70,3.95,4.10,4.20,4.20,4.35,4.65,9.25,4.95],
    [1.95,1.95,1.95,3.65,3.65,3.65,3.65,3.80,3.90,4.10,4.20,4.30,4.30,4.45,4.75,9.35,5.05],
    [1.95,1.95,1.95,1.95,3.85,3.85,3.85,3.85,4.05,4.10,4.25,4.30,4.45,4.40,4.60,4.85,9.50,5.20],
    [1.95,1.95,2.45,2.45,2.65,4.50,4.50,4.50,4.50,4.60,4.65,4.80,4.85,5.00,4.95,5.15,5.40,10.00,5.75],
    [1.95,2.65,2.90,3.05,3.05,3.25,4.90,4.90,4.90,4.90,4.95,5.05,5.20,5.25,5.35,5.35,5.55,5.80,10.40,6.10],
    [1.95,1.95,3.20,3.45,3.50,3.50,3.60,5.25,5.25,5.25,5.25,5.35,5.40,5.50,5.60,5.75,5.70,5.90,6.15,10.75,6.50],
    [1.95,1.95,1.95,3.45,3.60,3.65,3.65,3.80,5.40,5.40,5.40,5.40,5.50,5.55,5.70,5.75,5.90,5.85,6.05,6.30,10.90,6.65],
    [1.95,1.95,1.95,1.95,3.90,4.00,4.05,4.05,4.20,5.80,5.80,5.80,5.80,5.90,5.95,6.10,6.15,6.30,6.25,6.45,6.70,11.30,7.05],
    [1.95,1.95,1.95,3.05,3.55,4.10,4.20,4.25,4.25,4.40,6.00,6.00,6.00,6.00,6.10,6.15,6.30,6.35,6.50,6.45,6.65,6.90,11.50,7.25],
    [1.95,1.95,1.95,1.95,3.65,4.05,4.60,4.75,4.75,4.75,4.90,6.55,6.55,6.55,6.55,6.60,6.65,6.80,6.90,7.00,7.00,7.15,7.40,12.05,7.75],
    [4.75,4.20,4.00,3.60,3.45,2.95,2.35,1.95,1.95,1.95,1.95,1.95,3.85,3.85,3.85,3.85,4.05,4.10,4.25,4.30,4.45,4.40,4.60,4.85,9.45,5.15],
    [1.95,4.75,4.25,4.05,3.65,3.50,3.10,2.50,1.95,1.95,1.95,1.95,2.00,4.00,4.00,4.00,4.00,4.15,4.15,4.30,4.40,4.50,4.50,4.65,4.95,9.55,5.25],
    [1.95,1.95,4.85,4.30,4.10,3.70,3.55,3.20,2.60,1.95,1.95,1.95,1.95,2.15,4.10,4.10,4.10,4.10,4.20,4.25,4.40,4.45,4.55,4.55,4.75,5.00,9.60,5.30],
    [1.95,1.95,1.95,5.00,4.50,4.30,3.90,3.75,3.40,2.95,2.10,2.05,2.25,2.25,2.45,4.30,4.30,4.30,4.30,4.35,4.40,4.55,4.65,4.75,4.75,4.90,5.20,9.80,5.50],
    [1.95,1.95,1.95,1.95,5.20,4.65,4.45,4.05,3.90,3.55,3.20,2.40,2.35,2.55,2.55,2.70,4.45,4.45,4.45,4.45,4.55,4.60,4.75,4.80,4.90,4.90,5.10,5.35,9.95,5.65],
    [1.95,1.95,1.95,1.95,1.95,5.35,4.85,4.65,4.25,4.10,3.75,3.35,2.70,2.70,2.90,2.90,3.05,4.65,4.65,4.65,4.65,4.75,4.80,4.95,5.00,5.15,5.10,5.30,5.55,10.15,5.90],
    [2.90,2.55,2.25,1.95,1.95,1.95,4.75,4.25,4.05,3.65,3.50,3.05,2.45,1.95,1.95,1.95,1.95,1.95,3.45,3.45,3.45,3.45,3.60,3.70,3.95,4.10,4.20,4.20,4.35,4.65,9.25,4.95],
    [1.95,3.20,3.00,2.75,2.40,2.30,2.15,4.90,4.40,4.20,3.80,3.65,3.30,2.75,1.95,1.95,1.95,1.95,1.95,3.85,3.85,3.85,3.85,4.05,4.15,4.30,4.35,4.50,4.45,4.65,4.90,9.50,5.25],
    [1.95,1.95,3.40,3.20,3.05,2.75,2.60,2.45,5.10,4.60,4.40,4.00,3.85,3.45,3.10,2.30,2.25,1.95,1.95,2.15,4.20,4.20,4.20,4.20,4.30,4.35,4.45,4.55,4.70,4.65,4.85,5.10,9.70,5.45],
    [6.00,7.95,7.95,9.40,9.20,9.05,8.75,8.60,8.45,11.10,10.60,10.40,10.00,9.85,9.45,9.10,8.30,8.25,7.95,7.95,8.15,10.20,10.20,10.20,10.20,10.30,10.35,10.45,10.55,10.70,10.65,10.85,11.10,15.70,11.45],
    [7.95,1.95,1.95,2.50,3.70,3.50,3.30,3.15,3.10,2.90,5.40,4.90,4.70,4.30,4.10,3.80,3.40,2.75,2.70,2.50,2.50,2.65,4.50,4.50,4.50,4.50,4.60,4.65,4.80,4.85,4.95,4.95,5.15,5.40,10.00,5.70],
    [1.95,7.95,1.95,2.40,2.85,3.95,3.70,3.55,3.35,3.35,3.25,5.65,5.10,4.90,4.50,4.35,4.00,3.60,3.05,3.05,2.85,2.85,3.05,4.75,4.75,4.75,4.75,4.80,4.85,5.00,5.10,5.20,5.20,5.35,5.65,10.25,5.95],
    [1.95,1.95,8.55,2.55,2.85,3.30,4.20,4.00,3.85,3.65,3.60,3.50,5.90,5.40,5.20,4.80,4.65,4.30,3.90,3.40,3.40,3.30,3.30,3.40,5.00,5.00,5.00,5.00,5.10,5.15,5.30,5.35,5.50,5.45,5.65,5.90,10.55,6.25],
    [1.95,1.95,2.55,9.00,3.00,3.35,3.60,4.50,4.30,4.15,3.95,3.90,3.80,6.20,5.70,5.50,5.10,4.95,4.60,4.20,3.70,3.70,3.60,3.60,3.70,5.30,5.30,5.30,5.30,5.40,5.45,5.60,5.65,5.80,5.75,5.95,6.20,10.80,6.55],
    [1.95,1.95,1.95,3.25,9.65,3.65,3.80,4.10,5.00,4.80,4.65,4.45,4.40,4.30,6.70,6.20,6.00,5.55,5.40,5.05,4.70,4.15,4.15,4.10,4.10,4.20,5.80,5.80,5.80,5.80,5.85,5.95,6.10,6.15,6.25,6.25,6.45,6.70,11.30,7.00],
    [1.95,1.95,1.95,1.95,3.70,9.95,3.95,4.15,4.40,5.35,5.15,4.95,4.80,4.75,4.65,7.05,6.50,6.30,5.90,5.75,5.40,5.05,4.50,4.50,4.40,4.40,4.50,6.15,6.15,6.15,6.15,6.20,6.25,6.40,6.50,6.60,6.60,6.75,7.05,11.65,7.35],
    [3.70,3.35,2.60,1.95,1.95,1.95,8.55,2.55,2.85,3.30,4.20,4.00,3.85,3.65,3.60,3.50,5.90,5.40,5.20,4.80,4.65,4.30,3.90,3.40,3.40,3.30,3.30,3.40,5.00,5.00,5.00,5.00,5.10,5.15,5.30,5.35,5.50,5.45,5.65,5.90,10.50,6.25],
    [1.95,4.65,4.30,3.85,3.55,1.95,3.50,9.80,3.80,4.00,4.25,5.15,4.95,4.80,4.60,4.55,4.45,6.85,6.35,6.15,5.75,5.60,5.20,4.85,4.35,4.35,4.25,4.25,4.35,5.95,5.95,5.95,5.95,6.05,6.10,6.25,6.30,6.45,6.40,6.60,6.85,11.45,7.15],
    [1.95,1.95,4.80,4.50,4.00,3.70,1.95,3.65,9.95,3.95,4.15,4.40,5.30,5.10,4.95,4.75,4.70,4.65,7.00,6.50,6.30,5.90,5.75,5.40,5.00,4.50,4.50,4.40,4.40,4.50,6.15,6.15,6.15,6.15,6.20,6.25,6.40,6.45,6.60,6.55,6.75,7.00,11.60,7.35],
]

# Couldn't really copy/paste this one.
_raw_stations = [
    'Millbrae',
    'SFO Airport',
    'San Bruno',
    'South San Francisco',
    'Colma',
    'Daly City',
    'Balboa Park',
    'Glen Park',
    '24th St Mission',
    '16th St Mission',
    'Civic Center/UN Plaza',
    'Powell',
    'Montgomery',
    'Embarcadero',
    'West Oakland',
    '12th St/Oakland',
    '19th St/Oakland',
    'MacArthur',
    'Rockridge',
    'Orinda',
    'Lafayette',
    'Walnut Creek',
    'Pleasant Hill/Contra Costa',
    'Concord',
    'North Concord/Martinez',
    'Pittsburg/Bay Point',
    'Ashby',
    'Downtown Berkeley',
    'North Berkeley',
    'El Cerrito Plaza',
    'El Cerrito del Norte',
    'Richmond',
    'Lake Merritt',
    'Fruitvale',
    'Coliseum',
    'OAK Airport',
    'San Leandro',
    'Bay Fair',
    'Hayward',
    'South Hayward',
    'Union City',
    'Fremont',
    'Castro Valley',
    'West Dublin/Pleasanton',
    'Dublin/Pleasanton',
]

# http://www.bart.gov/guide
# Section: "Fares and Tickets" -> BART Excursion Fare
_self_fare = 5.75

# NOW WE POST-PROCESS
_num_stations = len(_raw_stations)

# Insert the self-fare for every row.
_raw_fares.insert(0, [])
for station in _raw_fares:
    station.insert(0, _self_fare)

# Pad with -1's, which we will replace later.
_raw_fares = [[-1] * (_num_stations - len(x)) + x for x in _raw_fares]

# Now add the "transpose" fares in.
FARES = np.rot90(np.array(_raw_fares))
for row in range(_num_stations):
    for col in range(row + 1, _num_stations):
        FARES[col, row] = FARES[row, col]
STATIONS = _raw_stations
