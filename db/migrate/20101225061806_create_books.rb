class CreateBooks < ActiveRecord::Migration
  def self.up
    create_table :books do |t|
      t.string :title, :null => false
      t.datetime :start_time, :null => false
      t.string :image
      t.string :link
    end
  end

  def self.down
    drop_table :books
  end
end
