from random import randint


n = 20
# generate n tuples of soilmoisture data, temperature data, and humidity data
# then ask for irrigationOn or irrigationOff
# then append to irrigation.csv
for i in range(n):
    soilmoisture = randint(0, 700)
    temperature = randint(5, 40)
    humidity = randint(0, 100)
    print(f'{soilmoisture}, {temperature}, {humidity}')
    print('Enter 1 for irrigation on, 0 for irrigation off')
    irrigationOn = input() == '1'
    with open('irrigation.csv', 'a') as f:
        f.write(f'{soilmoisture},{temperature},{humidity},{irrigationOn}\n')
