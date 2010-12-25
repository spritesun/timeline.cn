require 'spec_helper'

describe Book do
  describe "create" do
    it "should create book as cache in our site" do
      lambda do
        Book.create!(:title => "title", :image => "http://xx.jpg", :link => "http://www.douban.com/books/123", :start_time => Time.now)
      end.should change(Book, :count).by(1)
    end
  end
end
