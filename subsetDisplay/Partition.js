SSD.Partition = class Partition {
   constructor () {
      this.subsets = [];
   }

   get name() {
      return this.subsets[0].name +
             ', ..., ' +
             this.subsets[this.subsets.length - 1].name;
   }

   destroy() {
      this.subsets.forEach( (subset) => subset.destroy() );
      if ($('#partitions').length == 0) {
         $('#partitions_placeholder').show();
      }
   }
}
