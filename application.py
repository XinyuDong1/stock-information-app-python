from flask import Flask, jsonify, request, send_from_directory
import finnhub
from flask_cors import CORS
from datetime import datetime
from dateutil.relativedelta import relativedelta
import requests

application = Flask(__name__, static_folder = 'static')
CORS(application, resources={r"/*": {"origins": "http://localhost:5000"}})

# Setup Finnhub client
Finnhub_API_Key = 'cn566h1r01qocjm1djngcn566h1r01qocjm1djo0'
finnhub_client = finnhub.Client(api_key = Finnhub_API_Key)


@application.route('/home.html', methods=['GET'])
def home():
    return send_from_directory('static/html', 'home.html')

@application.route('/search', methods=['GET'])
def search():
    ticker = request.args.get('ticker')
    if not ticker:
        return jsonify({'error': 'Ticker symbol is required'}), 400
    
    company_profile = finnhub_client.company_profile2(symbol = ticker)

    return jsonify(company_profile)

@application.route('/stocksummary', methods=['GET'])
def stocksummary():
    ticker = request.args.get('ticker')
    stocksummary_quote = finnhub_client.quote(ticker)
    stocksummary_recc = finnhub_client.recommendation_trends(ticker)
    response = {
        'quote': stocksummary_quote,
        'recommendationTrends': stocksummary_recc
    }
    return jsonify(response)

Polygonio_API_Key = 'F1ax9K4fFaEfWAzFUF7sqV5krsY8FpRW'
def get_stock_data(ticker, from_date, to_date):
    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{from_date}/{to_date}?adjusted=true&sort=asc&apiKey={Polygonio_API_Key}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()['results']
    else:
        return []

@application.route('/charts', methods=['GET'])
def stock_data():
    ticker = request.args.get('ticker')
    to_date = datetime.now()
    from_date = to_date - relativedelta(months=6, days=2)
    to_date = to_date.strftime('%Y-%m-%d')
    from_date = from_date.strftime('%Y-%m-%d')
    data = get_stock_data(ticker, from_date, to_date)
    prices = [[point['t'], point['c']] for point in data]
    volumes = [[point['t'], point['v']] for point in data]

    return jsonify({'prices': prices, 'volumes': volumes})

@application.route('/latestnews', methods=['GET'])
def latestnews():
    ticker = request.args.get('ticker')
    current_date = datetime.now()
    thirty_days_ago = current_date - relativedelta(days=30)
    from_date = thirty_days_ago.strftime('%Y-%m-%d')
    to_date = current_date.strftime('%Y-%m-%d')
    url = f'https://finnhub.io/api/v1/company-news?symbol={ticker}&from={from_date}&to={to_date}&token={Finnhub_API_Key}'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return []

if __name__ == '__main__':
    application.run(debug = True)