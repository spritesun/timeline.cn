require "json"
require "open-uri"

class BooksController < ApplicationController
  def sync
    url = 'http://api.douban.com/people/1121626/collection?cat=book&tag=&status=read&start-index=1&max-results=10&alt=json'
    books = JSON.parse(get_http_resp(url))
    books["entry"].each do |book|
      Book.create!(:title => book["db:subject"]["title"]["$t"], 
      :start_time => book["updated"]["$t"], 
      :image => book["db:subject"]["link"][2]["@href"], 
      :link => book["db:subject"]["link"][1]["@href"])
    end
  end

  private
  def get_http_resp(url)
    resp_io = OpenURI.open_uri(url)
    resp = resp_io.read
    resp_io.close
    resp
  end
end
