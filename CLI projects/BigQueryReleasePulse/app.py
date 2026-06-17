import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Cache for parsed release notes to reduce external network calls and speed up loads
cache = {
    "data": None,
    "last_updated": None
}

def fetch_and_parse_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        xml_data = response.content
    except Exception as e:
        app.logger.error(f"Error fetching BigQuery feed: {e}")
        return {"error": f"Failed to fetch BigQuery feed: {str(e)}"}

    try:
        root = ET.fromstring(xml_data)
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry_node in root.findall('atom:entry', namespace):
            title_node = entry_node.find('atom:title', namespace)
            date = title_node.text if title_node is not None else "Unknown Date"
            
            link_node = entry_node.find("atom:link[@rel='alternate']", namespace)
            if link_node is None:
                link_node = entry_node.find("atom:link", namespace)
            link = link_node.get('href') if link_node is not None else "https://cloud.google.com/bigquery/docs/release-notes"
            
            content_node = entry_node.find('atom:content', namespace)
            content_html = content_node.text if content_node is not None else ""
            
            soup = BeautifulSoup(content_html, 'html.parser')
            
            # Fix relative links to absolute
            for a in soup.find_all('a', href=True):
                if a['href'].startswith('/'):
                    a['href'] = 'https://cloud.google.com' + a['href']
                # Make all links open in a new tab
                a['target'] = '_blank'
                a['rel'] = 'noopener noreferrer'
            
            # Group by <h3> headings
            h3_nodes = soup.find_all('h3')
            
            if not h3_nodes:
                # No <h3> tags, handle the whole content block as a single 'General' update
                raw_text = soup.get_text(separator=' ', strip=True)
                entries.append({
                    'id': entry_node.find('atom:id', namespace).text if entry_node.find('atom:id', namespace) is not None else date,
                    'date': date,
                    'type': 'General',
                    'content': str(soup),
                    'text': raw_text,
                    'link': link
                })
            else:
                for idx, h3 in enumerate(h3_nodes):
                    update_type = h3.get_text(strip=True)
                    
                    # Collect siblings until next h3
                    siblings = []
                    next_node = h3.next_sibling
                    while next_node and next_node.name != 'h3':
                        if next_node.name:
                            siblings.append(next_node)
                        next_node = next_node.next_sibling
                    
                    # Reconstruct HTML fragment
                    fragment_soup = BeautifulSoup('', 'html.parser')
                    for sib in siblings:
                        fragment_soup.append(sib)
                    
                    # Construct specific anchor if present in original feed link, or just the standard link
                    anchor_date = date.replace(' ', '_').replace(',', '')
                    specific_link = f"{link.split('#')[0]}#{anchor_date}"
                    
                    raw_text = fragment_soup.get_text(separator=' ', strip=True)
                    
                    entries.append({
                        'id': f"{entry_node.find('atom:id', namespace).text or date}_{idx}",
                        'date': date,
                        'type': update_type,
                        'content': str(fragment_soup),
                        'text': raw_text,
                        'link': specific_link
                    })
                    
        return {"releases": entries}
    except Exception as e:
        app.logger.error(f"Error parsing BigQuery feed XML: {e}")
        return {"error": f"Failed to parse BigQuery feed: {str(e)}"}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    # Fetch data
    result = fetch_and_parse_release_notes()
    if "error" in result:
        return jsonify(result), 500
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
