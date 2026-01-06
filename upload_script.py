import requests
try:
    files = {'file': open('sales_data.csv', 'rb')}
    data = {'db_name': 'phonetest', 'table_name': 'sales_data'}
    r = requests.post('http://localhost:5000/api/upload_csv', files=files, data=data)
    print(r.status_code)
    print(r.text)
except Exception as e:
    print(e)
