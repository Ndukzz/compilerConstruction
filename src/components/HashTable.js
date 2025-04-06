// Linked Lists

class Node {
  constructor(data, next = null) {
    this.data = data;
    this.next = next;
  }
} // End Node

class LinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
  }

  // Different methods
  // Insert first Node
  insertHead(data) {
    if (!this.head) {
      this.head = new Node(data);
    } else {
      let current = this.head;
      while (current.next) {
        if (
          current.data.lexeme === data.lexeme &&
          current.data.depth === data.depth
        ) {
          return;
        } else current = current.next;
      }
      this.head = new Node(data, this.head);
      if (
        current.data.lexeme === data.lexeme &&
        current.data.depth === data.depth
      ) {
        console.log(`Variable ${data.lexeme} already declared.`);
        return;
      }
    }
    this.size++;
  }

  // Insert Last Node
  insertLast(data) {
    let node = new Node(data);

    let current;

    if (!this.head) {
      this.head = node;
    } else {
      // loop through to the end of list
      current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = node;
    }

    this.size++;
  }

  //  Insert at index
  insertAtIndex(data, index) {
    // if index is out of range
    if (index > 0 && index > this.size) {
      console.log("Index out of range!!");
      return;
    }

    // if index is 0
    if (index === 0) {
      this.insertHead(data);
      return;
    }
  }

  // Lookup at index
  // print list
  printList() {
    let current = this.head;

    while (current) {
      console.log(current.data);
      current = current.next;
    }
  }
  // Delete at index/last node
  removeAt(index) {
    if (index > 0 && index > this.size) {
      return;
    }

    let current = this.head;
    let previous;
    let count = 0;

    // Remove first
    if (index === 0) {
      this.head = current.next;
    } else {
      while (count < index) {
        count++;
        previous = current;
        current = current.next;
      }

      previous.next = current.next;
    }

    this.size--;
  }
} // End Linked lists

//  Hash function
var hash = (string, max) => {
  var hash = 0;
  for (var i = 0; i < string.length; i++) {
    hash += string.charCodeAt(i);
  }
  return hash % max;
}; // End hash function

// ------------------------------------------------------------------------------

class HashTable {
  constructor() {
    this.storage = [];
    this.storageLimit = 210;
    this.errors = []
  }

  writeTable(depth) {
    let outputData = [];
    if (depth) {
      for (let i = 0; i < this.storage.length; i++) {
        if (this.storage[i]) {
          // if it is not undefined or null
          let current = this.storage[i].head;
          while (current.data) {
            if (current.data.depth === depth) {
              outputData.push(current.data);
            }
            if (current.next) {
              current = current.next;
            } else {
              break;
            }
          }
        }
      }
      outputData.forEach((element) => {
        // console.log(`
        //     Lexeme: ${element.lexeme}, Token: ${element.symToken}
        //     `);
      });
    } else {
      this.storage.map((node) => {
        let store = node.head;
        while (store) {
          // Collect the data from each node
          if (store.data) {
            outputData.push(store.data); // Add lexeme to outputData
          }
          store = store.next; // Move to the next node
        }
      });
    }

    // console.log("Linked List: ", this.storage);
    return outputData;
  }

  setValue(parameter, lexeme, props) {
    let searchResults = this.lookup(lexeme);
    let data;
    if (!searchResults) {
      console.error(lexeme + " has not been declared!");
      return; // error code
    } else {
      let index = hash(lexeme, this.storageLimit); // hash the lexeme
      let currNode = this.storage[index].head;
      //  if there is no bucket at that index
      while (currNode.data) {
        if (currNode.data.lexeme == lexeme) {
          data = {
            ...currNode.data,
            [parameter]: props,
          };
          this.storage[index].head.data = data;
        }
        if (currNode.next) {
          currNode = currNode.next;
        } else {
          break;
        }
      }
    }
  }

  insert(lexeme, symToken, depth, props = {}) {
    // ---------------------------------------

    let index = hash(lexeme, this.storageLimit); // hash the lexeme
    let data = {
      lexeme,
      symToken,
      depth,
      ...props,
    };

    // Using the result of the hash as its index in hash table
    if (this.storage[index] === undefined) {
      // If there is no bucket at that index, create a new linked list
      let newList = new LinkedList();
      newList.insertHead(data); // Insert the first node into the new linked list
      this.storage[index] = newList; // Assign the new linked list to the storage
    } else {
      // If there is already a bucket at that index, insert into the existing linked list
      let current = this.storage[index].head;
      while (current) {
        // Check if the data/variable name already exists in the list
        if (
          data.lexeme === current.data.lexeme &&
          data.depth === current.data.depth
        ) {
          console.error(`Variable ${data.lexeme} already declared.`);
          return; // Variable already declared, exit the method
        }
        current = current.next; // Move to the next node
      }
      // Insert the new data at the head of the existing linked list
      this.storage[index].insertHead(data);
    }

    // console.log(this.storage);
  }

  deleteDepth(depth) {
    // console.log(`Deleting all variables with depth of ${depth}`);
    this.storage = this.storage
      .map((list) => {
        if (!list) return list;

        let newList = new LinkedList();
        let current = list.head;

        while (current) {
          if (current.data.depth !== depth) {
            newList.insertLast(current.data);
          }
          current = current.next;
        }

        return newList.size > 0 ? newList : undefined;
      })
      .filter(Boolean);
  }

  lookup(lexeme) {
    let hashIndex = hash(lexeme, this.storageLimit);
    let current = this.storage[hashIndex].head;

    while (current) {
      if (current.data.lexeme === lexeme) {
        return current.data;
      }
      current = current.next;
    }
    return false;
  }
}

export default HashTable;
