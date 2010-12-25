require "spec_helper"

describe BooksController do
  render_views

  describe "GET 'sync'" do
    let(:read) { mock('open') }
    it "should fetch already read book resources from douban then save them indo db" do
      @read_book_io = open(File.join(Rails.root, "spec/fixtures/book.read.json"))
      OpenURI.stub!(:open_uri).and_return(@read_book_io)
      lambda do
        get :sync
      end.should change(Book, :count).by(2)
      response.should be_success
    end

    after(:each) do
      @read_book_io.close unless @read_book_io.closed?
    end
  end
end
